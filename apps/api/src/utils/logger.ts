export function logInfo(message: string, context?: unknown) {
  if (context) {
    console.log(message, context);
    return;
  }

  console.log(message);
}
