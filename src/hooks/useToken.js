import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { TOKEN_STORAGE_KEY } from '@/utils/constants'

export function useToken() {
	const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
	const [showToken, setShowToken] = useState(false)
	const { toast } = useToast()

	const handleTokenChange = (e) => {
		const newToken = e.target.value
		setToken(newToken)
		if (newToken) {
			localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
		} else {
			localStorage.removeItem(TOKEN_STORAGE_KEY)
		}
	}

	const handleClearToken = () => {
		setToken('')
		localStorage.removeItem(TOKEN_STORAGE_KEY)
		toast({
			title: 'Token removido',
			description: 'O token foi removido com sucesso',
		})
	}

	const toggleTokenVisibility = () => {
		setShowToken(!showToken)
	}

	return {
		token,
		showToken,
		handleTokenChange,
		handleClearToken,
		toggleTokenVisibility,
	}
}
