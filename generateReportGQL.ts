import {ApolloClient, InMemoryCache ,gql} from '@apollo/client'
import {IssuesResponse} from './types'
import { convertTimeInHoursMinSec,isDateBetween,getNumber } from './utils'
import fs from 'fs'
import {format, isBefore} from 'date-fns'


const baseUrl = 'https://gitlab.com/api/graphql?private_token='

const getCurrentMonthStart = () =>{

  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  return {
    firstDay : new Date(y, m-1, 1).toISOString(),
    lastDay : new Date(y, m , 0).toISOString(),
  }
}

const useDataGQL = gql`query CurrentUser {
    currentUser {
        id
    }
  }
`

const timeLogQuery = (userId:string) =>{
  return gql`
query CurrentUser {
    issues(assigneeId: "${userId}", first: 100, updatedAfter: "${getCurrentMonthStart().firstDay}") {
        count
        weight
        nodes {
            name
            timelogs(first: 100) {
                count
                totalSpentTime
                nodes {
                    id
                    spentAt
                    summary
                    timeSpent
                    user {
                        id
                        username
                    }
                }
                pageInfo {
                    hasNextPage
                }
            }
        }
      }
  }
  `
}

interface ITimeLogData{
  taskName: string
  dataTrack: IDataTrackInfo[]
}

interface IDataTrackInfo{
  description: string
  date: string
  timeLoggedInSeconds: number
}

const generateReport = async (userAcessToken: string) =>{
  const client = new ApolloClient({
    uri:  `${baseUrl}${userAcessToken}`,
    cache: new InMemoryCache()
  })
  let userData
  console.log('GEROU O CLIENT')
  const userResponse = await client.query({query: useDataGQL})
  if(userResponse.data){
    userData = userResponse.data.currentUser
  }else{
    throw new Error("Falha ao buscar informações do usuário")
  }
  const response: IssuesResponse = await client.query({query: timeLogQuery(getNumber(userData.id))})
  const timeLogs: ITimeLogData[] = []
  const dateReferences = getCurrentMonthStart()
  response.data.issues.nodes.forEach(node => {
    let timeLogAux: ITimeLogData =  { taskName: node.name, dataTrack: []}
    node.timelogs.nodes.forEach(timeLog => {
      const userIdUrl = userData.id
      const timeTrack: IDataTrackInfo[] = []
      if(timeLog.user.id === userIdUrl &&
        isDateBetween(new Date(timeLog.spentAt), new Date(dateReferences.firstDay), new Date(dateReferences.lastDay))){
        timeTrack.push({
          timeLoggedInSeconds: timeLog.timeSpent, 
          description: timeLog.summary, 
          date: timeLog.spentAt
        })
      }
      timeLogAux.dataTrack.push(...timeTrack)
    })
    if(timeLogAux.dataTrack.length > 0){
      timeLogs.push(timeLogAux)
    }
  })
  makeCsvFromLoadedData(timeLogs)
}

const makeCsvFromLoadedData = async (timeData: ITimeLogData[]) =>{
  let textData: string[] = []
  let totaTime = 0
  timeData.forEach(timeLog => {
    textData.push(`${timeLog.taskName}\n`)
    textData.push(';Descrição Atuação; Data; Tempo Utilizado  \n')
    const orderedData = timeLog.dataTrack.sort((a,b) => {
      if( isBefore(new Date(a.date), new Date(b.date))){
        return -1
      }
      return 1

    })
    orderedData.forEach(track => {
      textData.push(`;${track.description.replace("\n", '')}; ${format(track.date, 'dd/MM/yyyy')};${convertTimeInHoursMinSec(track.timeLoggedInSeconds)}\n`)
      totaTime += track.timeLoggedInSeconds
    })
    textData.push('\n\n')
  })
  textData.push(`;;Tempo Total Utilizado; ${convertTimeInHoursMinSec(totaTime)}`)
  fs.writeFileSync(`./relatoriosHora(${ format(getCurrentMonthStart().firstDay, 'MM-yyyy')}).csv`, textData.join(''), {encoding: 'utf16le'})
}

//PASSAR COMO PARAMETRO UM ACESS TOKEN DO GITLAB
generateReport('')