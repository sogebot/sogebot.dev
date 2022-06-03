export const scrollToRef = (ref: any) => window.scrollTo({ left: 0, top: ref.current.offsetTop, behavior: 'smooth'})
