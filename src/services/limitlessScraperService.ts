import * as cheerio from 'cheerio';
import axios from 'axios';

const limitless_url = "https://limitlesstcg.com";

interface Tournament {
    name: string;
    date: string;
    format: string;
    players: number;
    limitlessLink: string;
}

async function getLimitlessTournaments(): Promise<Tournament[]> {
    try {
        const response = await axios.get(limitless_url + '/tournaments');

        const html = response.data;
        const $ = cheerio.load(html);

        const tournaments: Tournament[] = [];

        $('table tbody tr:not(:first-child)').each((i, element) => {
            const tournament_element = $(element);

            const tournament = {
                name: tournament_element.attr('data-name') || '',
                date: tournament_element.attr('data-date') || '',
                format: tournament_element.attr('data-format') || '',
                players: parseInt(tournament_element.attr('data-players') || '0', 10),
                limitlessLink: tournament_element.find('td a').attr('href') || ''
            }

            tournaments.push(tournament);
        })

        console.log(tournaments);
        return tournaments;

    } catch (error) {
        console.error('Error fetching Limitless tournaments:', error);
        return [];
    }
}

export { getLimitlessTournaments };