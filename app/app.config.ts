export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      secondary: 'fuchsia',
      neutral: 'neutral',
    },
    card: {
      slots: {
        root: 'rounded-xl overflow-hidden',
      },
      variants: {
        variant: {
          outline: {
            root: 'bg-elevated ring ring-default divide-y divide-default',
          },
        },
      },
    },
  },
})
