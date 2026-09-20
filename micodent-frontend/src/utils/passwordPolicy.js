export function passwordPolicyError(value) {
  if (typeof value !== 'string' || [...value].length < 15 || !value.trim()) {
    return 'La nueva contrase\u00f1a debe tener al menos 15 caracteres.';
  }
  if (new TextEncoder().encode(value).length > 72) {
    return 'La nueva contrase\u00f1a no puede exceder 72 bytes UTF-8.';
  }
  return null;
}
