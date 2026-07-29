import { createContext, useContext, useState, ReactNode } from 'react'

interface ActiveRouteContextType {
  activeRoute: string
  setActiveRoute: (route: string) => void
}

const ActiveRouteContext = createContext<ActiveRouteContextType>({
  activeRoute: '/',
  setActiveRoute: () => {},
})

export function ActiveRouteProvider({ children }: { children: ReactNode }) {
  const [activeRoute, setActiveRoute] = useState('/')
  return (
    <ActiveRouteContext.Provider value={{ activeRoute, setActiveRoute }}>
      {children}
    </ActiveRouteContext.Provider>
  )
}

export function useActiveRoute() {
  return useContext(ActiveRouteContext)
}
