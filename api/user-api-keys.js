// API Route para gerenciar chaves API dos usuários de forma criptografada
import crypto from 'crypto';
import { supabase } from '../src/config/supabase';

const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

// Função para criptografar dados
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Função para descriptografar dados
function decrypt(encryptedData) {
  try {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Salvar/Atualizar chaves API do usuário
      const { userId, keys, encrypt: shouldEncrypt = true } = req.body;

      if (!userId || !keys) {
        return res.status(400).json({
          error: 'userId e keys são obrigatórios'
        });
      }

      // Criptografar as chaves se solicitado
      const dataToStore = shouldEncrypt ? encrypt(keys) : keys;

      // Verificar se já existe registro para o usuário
      const { data: existing } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', userId)
        .single();

      let result;
      if (existing) {
        // Atualizar registro existente
        result = await supabase
          .from('user_api_keys')
          .update({
            encrypted_keys: dataToStore,
            is_encrypted: shouldEncrypt,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        // Criar novo registro
        result = await supabase
          .from('user_api_keys')
          .insert({
            user_id: userId,
            encrypted_keys: dataToStore,
            is_encrypted: shouldEncrypt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log(`🔐 Chaves API salvas para usuário ${userId} (criptografadas: ${shouldEncrypt})`);
      res.json({ 
        success: true, 
        message: 'Chaves salvas com sucesso',
        encrypted: shouldEncrypt
      });

    } else if (req.method === 'GET') {
      // Carregar chaves API do usuário
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          error: 'userId é obrigatório'
        });
      }

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('encrypted_keys, is_encrypted')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum registro encontrado
          return res.json({ keys: null });
        }
        throw new Error(error.message);
      }

      // Descriptografar se necessário
      let keys = data.encrypted_keys;
      if (data.is_encrypted) {
        keys = decrypt(data.encrypted_keys);
        if (!keys) {
          throw new Error('Falha ao descriptografar chaves');
        }
      }

      console.log(`🔓 Chaves API carregadas para usuário ${userId}`);
      res.json({ 
        keys, 
        encrypted: data.is_encrypted 
      });

    } else if (req.method === 'DELETE') {
      // Deletar chaves API do usuário
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          error: 'userId é obrigatório'
        });
      }

      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      console.log(`🗑️ Chaves API removidas para usuário ${userId}`);
      res.json({ 
        success: true, 
        message: 'Chaves removidas com sucesso' 
      });

    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de chaves:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}