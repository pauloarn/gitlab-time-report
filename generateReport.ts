import axios from "axios";

interface ITimeStatsData {
  title: string;
  time_stats: {
    time_estimate: number,
    total_time_spent: number,
    human_time_estimate: string,
    human_total_time_spent: string | null
  }
}

const privateToken = " glpat-b-mU6nAxUG7CBTBRtkuo"
const GITLAB_BASE_URL = "https://gitlab.com/api/v4/projects/51934132/issues"
const MY_ID = "22511255"
const getGitLabData = async () => {
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  var firstDay = new Date(y, m, 1).toISOString();
  var lastDay = new Date(y, m + 1, 0).toISOString();

  const requestUrl = `${GITLAB_BASE_URL}?assignee_id=${MY_ID}&updated_after=${firstDay}&updated_before=${lastDay}`
  console.log(requestUrl);


  axios<ITimeStatsData[]>({
    method: 'GET',
    url: requestUrl,
    headers: {'PRIVATE-TOKEN': privateToken}
  }).then((response) => {
    processGitLabData(response.data)
  }).catch((error) => {
    console.log(error.data)
    console.log(error.message)
  })
}


function processGitLabData(data: ITimeStatsData[]) {
  let totalTimeInMinutes = 0
  data.map((d) => {
    const totalTimeSpent = d.time_stats.human_total_time_spent
    if (totalTimeSpent) {
      console.log(`${d.title}: ${totalTimeSpent}`)
      const hours = Number(totalTimeSpent.split("h")[0])
      const minutes = Number(totalTimeSpent.split("h")[1].split("m")[0])

      totalTimeInMinutes += (hours * 60) + minutes
    }
  })
  console.log(totalTimeInMinutes)
}

getGitLabData()