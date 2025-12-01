"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const supabaseClient_1 = require("./supabaseClient");
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// servir archivos estáticos
const publicPath = path_1.default.join(__dirname, '..', 'public');
app.use(express_1.default.static(publicPath));
// =============================
// RUTAS DE PÁGINAS
// =============================
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
app.get('/login', (_req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'login.html'));
});
app.get('/register', (_req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'register.html'));
});
app.get('/recover', (_req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'recover.html'));
});
// =============================
// RUTA MENÚ (PRODUCTOS)
// =============================
app.get('/api/menu', async (req, res) => {
    try {
        const { tipo } = req.query;
        let query = supabaseClient_1.supabase
            .from('menu')
            .select('id, "Nombre", "Descripcion", "PrecioOriente", "PrecioRestoPais", "PrecioAreaMetrop", tipo, "Activo", imagen')
            .eq('Activo', 1);
        if (tipo) {
            query = query.eq('tipo', Number(tipo));
        }
        const { data, error } = await query.order('id', { ascending: true });
        if (error) {
            console.error('[GET /api/menu] Supabase error:', error);
            return res.status(500).json({ message: 'Error al obtener menú' });
        }
        res.json(data);
    }
    catch (err) {
        console.error('[GET /api/menu] Error inesperado:', err);
        res.status(500).json({ message: 'Error inesperado en el servidor' });
    }
});
// =============================
// AUTH: REGISTRO
// =============================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, correo, tipodocumento, documento, celular, direccionentrega, Departamento, Municipio, Barrio, contrasena, } = req.body;
        if (!nombre ||
            !correo ||
            !tipodocumento ||
            !documento ||
            !celular ||
            !direccionentrega ||
            !Departamento ||
            !Municipio ||
            !contrasena) {
            return res
                .status(400)
                .json({ message: 'Faltan campos obligatorios en el registro' });
        }
        const { data: existing, error: existError } = await supabaseClient_1.supabase
            .from('usuarios')
            .select('id')
            .eq('correo', correo)
            .maybeSingle();
        if (existError) {
            console.error('[Register] error buscando usuario:', existError);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
        if (existing) {
            return res.status(409).json({ message: 'El correo ya está registrado' });
        }
        // OJO: en producción deberías hashear la contraseña con bcrypt
        const { data: userInsert, error: userError } = await supabaseClient_1.supabase
            .from('usuarios')
            .insert([
            {
                correo,
                Contrasena: contrasena,
                Rol: '0',
            },
        ])
            .select('id')
            .maybeSingle();
        if (userError || !userInsert) {
            console.error('[Register] error insertando usuario:', userError);
            return res
                .status(500)
                .json({ message: 'No se pudo crear el usuario' });
        }
        const { error: formError } = await supabaseClient_1.supabase.from('formulario').insert([
            {
                correo,
                nombre,
                tipodocumento,
                documento,
                celular,
                direccionentrega,
                Departamento,
                Municipio,
                Barrio: Barrio || '...',
            },
        ]);
        if (formError) {
            console.error('[Register] error insertando formulario:', formError);
            return res.status(500).json({
                message: 'Usuario creado, pero fallo en datos de perfil',
            });
        }
        res.status(201).json({ message: 'Usuario registrado correctamente' });
    }
    catch (err) {
        console.error('[Register] error inesperado:', err);
        res.status(500).json({ message: 'Error inesperado en el servidor' });
    }
});
// =============================
// AUTH: LOGIN
// =============================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        if (!correo || !contrasena) {
            return res
                .status(400)
                .json({ message: 'Correo y contraseña son obligatorios' });
        }
        const { data: user, error } = await supabaseClient_1.supabase
            .from('usuarios')
            .select('id, correo, "Contrasena", "Rol"')
            .eq('correo', correo)
            .maybeSingle();
        if (error) {
            console.error('[Login] error buscando usuario:', error);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
        if (!user || user.Contrasena !== contrasena) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }
        res.json({
            message: 'Login exitoso',
            userId: user.id,
            rol: user.Rol,
        });
    }
    catch (err) {
        console.error('[Login] error inesperado:', err);
        res.status(500).json({ message: 'Error inesperado en el servidor' });
    }
});
// =============================
// AUTH: RECUPERAR
// =============================
app.post('/api/auth/recover', async (req, res) => {
    try {
        const { correo } = req.body;
        if (!correo) {
            return res.status(400).json({ message: 'Correo es obligatorio' });
        }
        const { data: user, error } = await supabaseClient_1.supabase
            .from('usuarios')
            .select('id')
            .eq('correo', correo)
            .maybeSingle();
        if (error) {
            console.error('[Recover] error buscando correo:', error);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
        if (!user) {
            console.log('[Recover] correo no registrado:', correo);
        }
        else {
            console.log('[Recover] solicitud de recuperación para usuario:', user.id);
        }
        res.json({
            message: 'Si el correo existe, se enviarán instrucciones',
        });
    }
    catch (err) {
        console.error('[Recover] error inesperado:', err);
        res.status(500).json({ message: 'Error inesperado en el servidor' });
    }
});
// =============================
// ARRANCAR SERVIDOR
// =============================
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
