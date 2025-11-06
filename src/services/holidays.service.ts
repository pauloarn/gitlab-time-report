import axios from 'axios'
import type { Holiday } from '@/types'

const HOLIDAYS_API_BASE_URL = 'https://brasilapi.com.br/api/feriados/v1'

export class HolidaysService {
  static async fetchHolidays(year: number): Promise<Holiday[]> {
    try {
      const response = await axios.get<Holiday[]>(
        `${HOLIDAYS_API_BASE_URL}/${year}`
      )
      return response.data
    } catch (error) {
      throw new Error(
        `Erro ao buscar feriados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }
}

