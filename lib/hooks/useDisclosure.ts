import { useState } from 'react'

const useDisclosure = (defaultOpen = false) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  const toggle = () => setIsOpen((prev) => !prev)
  const onToggle = toggle

  return {
    isOpen,
    setIsOpen,
    onOpen,
    onClose,
    toggle,
    onToggle,
  }
}

export { useDisclosure }
export default useDisclosure
