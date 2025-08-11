export function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

export function randomInRange(minValue, maxValue) {
  return Math.random() * (maxValue - minValue) + minValue;
}

export function randomIntInRange(minValue, maxValue) {
  return Math.floor(randomInRange(minValue, maxValue + 1));
}