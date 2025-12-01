// src/server.ts
import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_KEY en el .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas estáticas a /public
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// -------------------- RUTAS DE PÁGINAS --------------------

// Página principal
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Login
app.get('/login', (_req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

// Registro
app.get('/register', (_req, res) => {
  res.sendFile(path.join(publicPath, 'register.html'));
});

// Recuperar contraseña
app.get('/recover', (_req, res) => {
  res.sendFile(path.join(publicPath, 'recover.html'));
});

// Página de detalle de producto
app.get('/product', (_req, res) => {
  res.sendFile(path.join(publicPath, 'product.html'));
});

// Página de carrito
app.get('/cart', (_req, res) => {
  res.sendFile(path.join(publicPath, 'cart.html'));
});

// -------------------- API MENÚ --------------------

// GET /api/menu?tipo=1
app.get('/api/menu', async (req, res) => {
  try {
    const { tipo } = req.query;

    let query = supabase
      .from('menu')
      .select(
        'id, "Nombre", "Descripcion", "PrecioOriente", "PrecioRestoPais", "PrecioAreaMetrop", tipo, "Activo", imagen'
      )
      .eq('Activo', 1);

    if (tipo) {
      query = query.eq('tipo', Number(tipo));
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
      console.error('[GET /api/menu] error supabase:', error);
      return res.status(500).json({ message: 'Error al obtener menú' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[GET /api/menu] error inesperado:', err);
    res.status(500).json({ message: 'Error inesperado en el servidor' });
  }
});

// GET /api/menu/item/:id
app.get('/api/menu/item/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { data, error } = await supabase
      .from('menu')
      .select(
        'id, "Nombre", "Descripcion", "PrecioOriente", "PrecioRestoPais", "PrecioAreaMetrop", tipo, "Activo", imagen'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[GET /api/menu/item/:id] error supabase:', error);
      return res.status(500).json({ message: 'Error al obtener producto' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('[GET /api/menu/item/:id] error inesperado:', err);
    res.status(500).json({ message: 'Error inesperado en el servidor' });
  }
});

// -------------------- API AUTH BÁSICA --------------------

// POST /api/auth/register
// Crea usuario en "usuarios" y datos en "formulario"
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      nombre,
      correo,
      tipodocumento,
      documento,
      celular,
      direccionentrega,
      Departamento,
      Municipio,
      Barrio,
      contrasena,
    } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        message: 'Nombre, correo y contraseña son obligatorios',
      });
    }

    // 1. Crear usuario en "usuarios"
    const { data: userInsert, error: userError } = await supabase
      .from('usuarios')
      .insert([
        {
          correo,
          Contrasena: contrasena, // En producción deberías encriptarla
          Rol: '0',
        },
      ])
      .select('id')
      .maybeSingle();

    if (userError) {
      console.error('[POST /api/auth/register] error usuarios:', userError);
      if (userError.code === '23505') {
        return res.status(400).json({ message: 'El correo ya está registrado' });
      }
      return res.status(500).json({ message: 'Error al crear usuario' });
    }

    const userId = userInsert?.id;

    // 2. Crear registro en "formulario"
    const { error: formError } = await supabase.from('formulario').insert([
      {
        correo,
        nombre,
        tipodocumento,
        documento,
        celular: celular ? Number(celular) : 0,
        direccionentrega,
        Departamento: Departamento || '...',
        Municipio: Municipio || '...',
        Barrio: Barrio || '...',
      },
    ]);

    if (formError) {
      console.error('[POST /api/auth/register] error formulario:', formError);
      return res
        .status(500)
        .json({ message: 'Usuario creado, pero error al guardar datos' });
    }

    res.status(201).json({ message: 'Registro exitoso', userId });
  } catch (err) {
    console.error('[POST /api/auth/register] error inesperado:', err);
    res.status(500).json({ message: 'Error inesperado en el servidor' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res
        .status(400)
        .json({ message: 'Correo y contraseña son obligatorios' });
    }

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, correo, "Contrasena", "Rol"')
      .eq('correo', correo)
      .maybeSingle();

    if (error) {
      console.error('[POST /api/auth/login] error supabase:', error);
      return res.status(500).json({ message: 'Error al buscar usuario' });
    }

    if (!user || user.Contrasena !== contrasena) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Cargar perfil desde "formulario"
    const { data: form, error: formError } = await supabase
      .from('formulario')
      .select(
        'nombre, celular, direccionentrega, "Departamento", "Municipio", "Barrio"'
      )
      .eq('correo', correo)
      .maybeSingle();

    if (formError) {
      console.error('[POST /api/auth/login] error formulario:', formError);
    }

    res.json({
      userId: user.id,
      rol: user.Rol,
      perfil: form || null,
    });
  } catch (err) {
    console.error('[POST /api/auth/login] error inesperado:', err);
    res.status(500).json({ message: 'Error inesperado en el servidor' });
  }
});

// POST /api/auth/recover
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ message: 'Correo es obligatorio' });
    }

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('correo', correo)
      .maybeSingle();

    if (error) {
      console.error('[POST /api/auth/recover] error supabase:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    // En producción: generar token, guardar en tabla, enviar correo
    console.log(
      '[Recover] Solicitud de recuperación para:',
      correo,
      'existe?',
      !!user
    );

    return res.json({
      message: 'Si el correo existe, te enviaremos instrucciones.',
    });
  } catch (err) {
    console.error('[POST /api/auth/recover] error inesperado:', err);
    res.status(500).json({ message: 'Error inesperado en el servidor' });
  }
});

// -------------------- ARRANQUE DEL SERVIDOR --------------------
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
