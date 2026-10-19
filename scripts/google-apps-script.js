/**
 * ============================================================
 * OOPSY — Apps Script: "Publicar Portafolio Web" (Google Sheets)
 * ============================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN EN GOOGLE SHEETS:
 * 1. En tu hoja de Google Sheets, ve al menú superior:
 *    Extensiones > Apps Script
 * 2. Borra el código por defecto y pega todo el contenido de este archivo.
 * 3. Reemplaza la constante VERCEL_DEPLOY_HOOK_URL con tu enlace de Deploy Hook de Vercel.
 * 4. Haz clic en "Guardar" (ícono de disquete) y recarga tu Google Sheet.
 * 5. Aparecerá un nuevo menú en la barra superior llamado: "✦ Oopsy Web".
 * 6. Al hacer clic en "🚀 Publicar Portafolio en Vivo", disparará el build automático en Vercel.
 */

// Pega aquí la URL de Deploy Hook creada en Vercel (Project Settings > Git > Deploy Hooks)
var VERCEL_DEPLOY_HOOK_URL = "https://api.vercel.com/v1/integrations/deploy/prj_xxxxxxx/xxxxxxxx";

/**
 * Agrega el menú personalizado a la barra de herramientas de Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("✦ Oopsy Web")
    .addItem("🚀 Publicar Portafolio en Vivo", "dispararPublicacionVercel")
    .addSeparator()
    .addItem("🔍 Verificar Proyectos Listos", "verificarProyectosPublicados")
    .addToUi();
}

/**
 * Dispara el Deploy Hook de Vercel para optimizar y publicar las fotos
 */
function dispararPublicacionVercel() {
  var ui = SpreadsheetApp.getUi();

  if (!VERCEL_DEPLOY_HOOK_URL || VERCEL_DEPLOY_HOOK_URL.indexOf("prj_xxxxxxx") !== -1) {
    ui.alert(
      "⚠️ Falta configurar el Deploy Hook",
      "Debes colocar tu URL real de Deploy Hook de Vercel en la variable VERCEL_DEPLOY_HOOK_URL dentro de Extensiones > Apps Script.",
      ui.ButtonSet.OK
    );
    return;
  }

  var respuesta = ui.alert(
    "Publicar Portafolio en Vivo",
    "¿Deseas iniciar la sincronización de imágenes y publicar el sitio web en Vercel?",
    ui.ButtonSet.YES_NO
  );

  if (respuesta === ui.Button.YES) {
    try {
      var options = {
        method: "post",
        muteHttpExceptions: true
      };
      
      var response = UrlFetchApp.fetch(VERCEL_DEPLOY_HOOK_URL, options);
      var statusCode = response.getResponseCode();

      if (statusCode >= 200 && statusCode < 300) {
        ui.alert(
          "✨ ¡Publicación Iniciada con Éxito!",
          "Vercel ha recibido la orden de compilación.\n\n" +
          "1. Se están sincronizando las imágenes de tus carpetas de Google Drive.\n" +
          "2. Se optimizarán a WebP/AVIF reduciendo su peso de ~10MB a ~250KB.\n" +
          "3. En aproximadamente 1 minuto tus cambios estarán en vivo para los usuarios.",
          ui.ButtonSet.OK
        );
      } else {
        ui.alert(
          "Error al contactar Vercel",
          "Código HTTP: " + statusCode + "\nRespuesta: " + response.getContentText(),
          ui.ButtonSet.OK
        );
      }
    } catch (e) {
      ui.alert(
        "Error de conexión",
        "No se pudo conectar con Vercel: " + e.message,
        ui.ButtonSet.OK
      );
    }
  }
}

/**
 * Función auxiliar para verificar cuántas filas están marcadas como "Publicado"
 */
function verificarProyectosPublicados() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var ui = SpreadsheetApp.getUi();

  // Buscar columna Estado
  var estadoColIndex = -1;
  var idColIndex = -1;
  var tituloColIndex = -1;

  for (var r = 0; r < Math.min(5, data.length); r++) {
    for (var c = 0; c < data[r].length; c++) {
      var val = String(data[r][c]).trim().toLowerCase();
      if (val === "estado") estadoColIndex = c;
      if (val === "id proyecto") idColIndex = c;
      if (val === "título del proyecto") tituloColIndex = c;
    }
    if (estadoColIndex !== -1) break;
  }

  if (estadoColIndex === -1) {
    ui.alert("No se encontró la columna 'Estado' en la hoja actual.");
    return;
  }

  var publicados = [];
  for (var i = r + 1; i < data.length; i++) {
    var estado = String(data[i][estadoColIndex]).trim().toLowerCase();
    if (estado === "publicado") {
      var id = idColIndex !== -1 ? data[i][idColIndex] : ("Fila " + (i + 1));
      var titulo = tituloColIndex !== -1 ? data[i][tituloColIndex] : "";
      publicados.push("• " + id + (titulo ? " - " + titulo : ""));
    }
  }

  ui.alert(
    "Proyectos listos para publicación (" + publicados.length + ")",
    publicados.length > 0
      ? "Los siguientes proyectos se compilarán en el sitio:\n\n" + publicados.join("\n")
      : "No hay filas con Estado = 'Publicado'. Cambia el estado a 'Publicado' para que aparezcan en la web.",
    ui.ButtonSet.OK
  );
}
