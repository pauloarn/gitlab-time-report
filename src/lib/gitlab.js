import {ApolloClient, gql, InMemoryCache} from '@apollo/client';
import {format, isBefore} from 'date-fns';
import {convertTimeInHoursMinSec, getNumber, isDateBetween} from './utils';

const baseUrl = 'https://gitlab.com/api/graphql';

const getMonthPeriod = (selectedDate) => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    return {
        firstDay: new Date(y, m, 1).toISOString(),
        lastDay: new Date(y, m + 1, 0).toISOString(),
    };
};

const useDataGQL = gql`
    query CurrentUser {
        currentUser {
            id
        }
    }
`;

const timeLogQuery = (userId, selectedDate) => {
    return gql`
        query CurrentUser {
            issues(assigneeId: "${userId}", first: 100, updatedAfter: "${selectedDate}") {
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
    `;
};

export async function generateReport(userAccessToken, selectedMonth) {
    const client = new ApolloClient({
        uri: `${baseUrl}`,
        headers: {
            'Authorization': `Bearer ${userAccessToken}`,
        },
        cache: new InMemoryCache(),
    });

    try {
        const userResponse = await client.query({query: useDataGQL});
        if (!userResponse.data) {
            throw new Error("Falha ao buscar informações do usuário");
        }

        const userData = userResponse.data.currentUser;
        const response = await client.query({
            query: timeLogQuery(getNumber(userData.id), selectedMonth)
        });

        const timeLogs = [];
        const dateReferences = getMonthPeriod(selectedMonth);
        response.data.issues.nodes.forEach(node => {
            const timeLogAux = {taskName: node.name, dataTrack: []};

            node.timelogs.nodes.forEach(timeLog => {
                if (timeLog.user.id === userData.id &&
                    isDateBetween(
                        new Date(timeLog.spentAt),
                        new Date(dateReferences.firstDay),
                        new Date(dateReferences.lastDay)
                    )) {
                    timeLogAux.dataTrack.push({
                        timeLoggedInSeconds: timeLog.timeSpent,
                        description: timeLog.summary,
                        date: timeLog.spentAt
                    });
                }
            });

            if (timeLogAux.dataTrack.length > 0) {
                timeLogs.push(timeLogAux);
            }
        });
        return timeLogs
    } catch (error) {
        throw new Error(`Erro ao gerar relatório: ${error.message}`);
    }
}

function formatCSVData(timeData) {
    let textData = [];
    let totalTime = 0;

    timeData.forEach(timeLog => {
        textData.push(`${timeLog.taskName}\n`);
        textData.push('Descrição Atuação;Data;Tempo Utilizado\n');

        const orderedData = timeLog.dataTrack.sort((a, b) => {
            return isBefore(new Date(a.date), new Date(b.date)) ? -1 : 1;
        });

        orderedData.forEach(track => {
            textData.push(
                `${track.description.replace("\n", '')};${format(new Date(track.date), 'dd/MM/yyyy')};${convertTimeInHoursMinSec(track.timeLoggedInSeconds)}\n`
            );
            totalTime += track.timeLoggedInSeconds;
        });

        textData.push('\n\n');
    });

    textData.push(`Tempo Total Utilizado;${convertTimeInHoursMinSec(totalTime)}`);

    return textData.join('');
}

export function downloadCSV(content, date) {
    const data = formatCSVData(content);
    const filename = `horas-trabalhadas-${date.getMonth()}-${date.getDate()}.csv`;

    const blob = new Blob([data], {type: 'text/csv;charset=utf-16le'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
