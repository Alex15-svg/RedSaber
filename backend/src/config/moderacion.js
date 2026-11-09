// Valores de la moderación (RF-12). El informe los deja «por definir», así que se leen
// del archivo .env y, si no están, se usan estos valores por defecto.
module.exports = {
    UMBRAL_REPORTES: Number(process.env.MODERACION_UMBRAL) || 3,       // reportes para deshabilitar
    PLAZO_APELACION_DIAS: Number(process.env.PLAZO_APELACION_DIAS) || 7 // días para apelar
};
