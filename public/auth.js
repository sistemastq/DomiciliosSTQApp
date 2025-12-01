// public/auth.js

function togglePasswordVisibility(button) {
  const inputName = button.dataset.target;
  if (!inputName) return;
  const form = button.closest("form");
  if (!form) return;
  const input = form.querySelector(`input[name="${inputName}"]`);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    button.querySelector(".material-symbols-outlined").textContent =
      "visibility";
  } else {
    input.type = "password";
    button.querySelector(".material-symbols-outlined").textContent =
      "visibility_off";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // botones mostrar/ocultar contraseña
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => togglePasswordVisibility(btn));
  });

  // ============= LOGIN =============
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    const errorEl = document.getElementById("login-error");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorEl) {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      }

      const formData = new FormData(loginForm);
      const correo = formData.get("correo")?.toString().trim();
      const contrasena = formData.get("contrasena")?.toString();

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, contrasena }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Error al iniciar sesión");
        }

        const perfil = data.perfil || {};

        const userPayload = {
          userId: data.userId,
          rol: data.rol,
          correo,
          nombre: perfil.nombre || "",
          direccionentrega: perfil.direccionentrega || "",
          celular: perfil.celular || null,
        };

        localStorage.setItem("burgerUser", JSON.stringify(userPayload));

        window.location.href = "/";
      } catch (err) {
        console.error("[Login] error:", err);
        if (errorEl) {
          errorEl.textContent =
            err instanceof Error ? err.message : "Error al iniciar sesión";
          errorEl.classList.remove("hidden");
        }
      }
    });
  }

  // ============= REGISTRO =============
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    const errorEl = document.getElementById("register-error");
    const successEl = document.getElementById("register-success");

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorEl) {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      }
      if (successEl) {
        successEl.classList.add("hidden");
        successEl.textContent = "";
      }

      const formData = new FormData(registerForm);

      const contrasena = formData.get("contrasena")?.toString() || "";
      const confirmar = formData
        .get("confirmarContrasena")
        ?.toString() || "";

      if (contrasena !== confirmar) {
        if (errorEl) {
          errorEl.textContent = "Las contraseñas no coinciden.";
          errorEl.classList.remove("hidden");
        }
        return;
      }

      const payload = {
        nombre: formData.get("nombre")?.toString().trim(),
        correo: formData.get("correo")?.toString().trim(),
        tipodocumento: formData.get("tipodocumento")?.toString(),
        documento: formData.get("documento")?.toString(),
        celular: formData.get("celular")?.toString(),
        direccionentrega: formData.get("direccionentrega")?.toString(),
        Departamento: formData.get("Departamento")?.toString(),
        Municipio: formData.get("Municipio")?.toString(),
        Barrio: formData.get("Barrio")?.toString(),
        contrasena,
      };

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Error al registrar usuario");
        }

        if (successEl) {
          successEl.textContent = "Registro exitoso. Redirigiendo…";
          successEl.classList.remove("hidden");
        }

        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      } catch (err) {
        console.error("[Register] error:", err);
        if (errorEl) {
          errorEl.textContent =
            err instanceof Error ? err.message : "Error al registrar";
          errorEl.classList.remove("hidden");
        }
      }
    });
  }

  // ============= RECUPERAR =============
  const recoverForm = document.getElementById("recover-form");
  if (recoverForm) {
    const errorEl = document.getElementById("recover-error");
    const successEl = document.getElementById("recover-success");

    recoverForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorEl) {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      }
      if (successEl) {
        successEl.classList.add("hidden");
        successEl.textContent = "";
      }

      const formData = new FormData(recoverForm);
      const correo = formData.get("correo")?.toString().trim();

      try {
        const res = await fetch("/api/auth/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Error al procesar solicitud");
        }

        if (successEl) {
          successEl.textContent =
            "Si el correo existe, te enviaremos instrucciones.";
          successEl.classList.remove("hidden");
        }
      } catch (err) {
        console.error("[Recover] error:", err);
        if (errorEl) {
          errorEl.textContent =
            err instanceof Error ? err.message : "Error al procesar solicitud";
          errorEl.classList.remove("hidden");
        }
      }
    });
  }
});
