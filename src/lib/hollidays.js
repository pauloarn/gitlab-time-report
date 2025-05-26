import axios from "axios";

export const fetchHollidays = async (year) => {
    const res = await axios.get(`https://brasilapi.com.br/api/feriados/v1/${year}`)
    return res.data
}
