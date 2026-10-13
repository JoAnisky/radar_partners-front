export function useApi() {
  const { public: { apiBaseUrl } } = useRuntimeConfig()

  return $fetch.create({ baseURL: apiBaseUrl })
}
