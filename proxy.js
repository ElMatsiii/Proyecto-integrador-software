// proxy.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// --- LOGIN ---
app.get("/login", async (req, res) => {
  const { email, password } = req.query;
  const url = `https://puclaro.ucn.cl/eross/avance/login.php?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

  try {
    console.log("Solicitando login:", url);
    const response = await fetch(url);
    const text = await response.text();
    console.log("Respuesta login:", text);
    res.status(response.status).send(text);
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error al conectar con la API de login" });
  }
});

// --- MALLA ---
app.get("/malla", async (req, res) => {
  const { codigo, catalogo } = req.query;
  const url = `https://losvilos.ucn.cl/hawaii/api/mallas?8266-202410`;
   try {
    console.log("Solicitando malla:", url);
 
    // IMPORTANTE: se envía el User-Agent y el header correcto
    const response = await fetch(url, {
      method: 'GET',
      headers: {

        'X-HAWAII-AUTH': 'jf400fejof13f'
        
      },
    });

    const text = await response.text();

    // Loguear respuesta para debugging
    console.log("Status malla:", response.status);
    console.log("Respuesta cruda de API malla:", text.slice(0, 300)); // muestra solo 300 chars

    if (response.status === 401) {
      return res.status(401).json({
        error: "No autorizado. Verifica el header X-HAWAII-AUTH o acceso a la API de malla."
      });
    }

    res.status(response.status).send(text);

  } catch (err) {
    console.error("Error en malla:", err);
    res.status(500).json({ error: "Error al conectar con la API de mallas" });
  }
});
 

  

const PORT = 3000;
app.listen(PORT, () => console.log(` Proxy activo en http://localhost:${PORT}`));
