export function useDemo() {
  return Boolean(useRuntimeConfig().public.demoMode)
}
