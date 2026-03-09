import * as cheerio from 'cheerio';
import axios from 'axios';

const limitless_url = "https://limitlesstcg.com";

enum cardType {
    Pokemon = 'Pokemon',
    Trainer = 'Trainer',
    Energy = 'Energy'
}

const cardTypesArray = Object.values(cardType);

interface Tournament {
    name: string;
    date: string;
    format: string;
    players: number;
    limitlessLink: string;
}

interface TournamentPlayer {
    name: string;
    place: number;
    limitlessLink: string;
}

interface DecklistCard {
    name: string;
    set: string;
    setNumber: string;
    quantity: number;
    type: cardType;
}

interface Decklist {
    deckName: string;
    cards: DecklistCard[];
}

async function getLimitlessTournaments(): Promise<Tournament[]> {
    try {
        const response = await axios.get(limitless_url + '/tournaments');

        const html = response.data;
        const $ = cheerio.load(html);

        const tournaments: Tournament[] = [];

        $('table tbody tr:not(:first-child)').each((i, element) => {
            const tournament_element = $(element);

            const tournament: Tournament = {
                name: tournament_element.attr('data-name') || '',
                date: tournament_element.attr('data-date') || '',
                format: tournament_element.attr('data-format') || '',
                players: parseInt(tournament_element.attr('data-players') || '0', 10),
                limitlessLink: tournament_element.find('td a').attr('href') || ''
            }

            tournaments.push(tournament);
        })

        return tournaments;

    } catch (error) {
        console.error('Error fetching Limitless tournaments:', error);
        return [];
    }
}

// Não inclui players sem decklist (decidir se deixar isso aqui mesmo ou no controller, visto que é logica de negócio)
async function getLimitlessTournamentPlayers(tournamentLink: string, n_players: number): Promise<TournamentPlayer[]> {
    try {
        const response = await axios.get(limitless_url + tournamentLink);
        const html = response.data;
        const $ = cheerio.load(html);
        const players: TournamentPlayer[] = [];

        $('table tbody tr:not(:first-child)').each((i, element) => {
            if (i < n_players) {
                const player_element = $(element);

                const player: TournamentPlayer = {
                    name: player_element.attr('data-name') || '',
                    place: parseInt(player_element.attr('data-rank') || '0', 10),
                    limitlessLink: player_element.find('td:nth-child(5) a').attr('href') || ''
                }
                if (player.limitlessLink != '') {
                    players.push(player);
                }         
            }
        })
        return players;
    } catch (error) {
        console.error('Error fetching Limitless tournament players:', error);
        return [];
    }
}

async function getLimitlessDecklist(decklistLink: string): Promise<Decklist> {
    try {
        const response = await axios.get(limitless_url + decklistLink);
        const html = response.data;
        const $ = cheerio.load(html);

        const deckName = $('div.decklist-title').children().remove().end().text().trim();
        const cards: DecklistCard[] = [];

        $('div.decklist-cards > div').each((column_i, decklistColumn) => {
            $(decklistColumn).find('.decklist-card').each((i, element) => {
                const card_element = $(element);

                const card: DecklistCard = {
                    name: card_element.find('span.card-name').text().trim(),
                    set: card_element.attr('data-set') || '',
                    setNumber: card_element.attr('data-number') || '',
                    quantity: parseInt(card_element.find('span.card-count').text().trim(), 10),
                    type: cardTypesArray[column_i] as cardType
                }
                cards.push(card);
            })
        })

        const decklist: Decklist = {
            deckName,
            cards
        }
        return decklist;
        
    } catch (error) {
        console.error('Error fetching Limitless decklist:', error);
        return { deckName: '', cards: [] };
    }
}

async function getLimitlessDecksFromTournament(tournamentLink: string, n_players: number): Promise<Decklist[]> {
    try {
        const players = await getLimitlessTournamentPlayers(tournamentLink, n_players);
        const decklists: Decklist[] = [];
        for (const player of players) {
            const decklist = await getLimitlessDecklist(player.limitlessLink);
            decklists.push(decklist);
        }
        return decklists;
    } catch (error) {
        console.error('Error fetching Limitless decks from tournament:', error);
        return [];
    }
}

async function getLimitlessDecksFromRecentTournaments(n_players: number): Promise<Decklist[]> {
    try {
        const tournaments = await getLimitlessTournaments();
        const decklists: Decklist[] = [];
        for (const tournament of tournaments) {
            const tournamentDecklists = await getLimitlessDecksFromTournament(tournament.limitlessLink, n_players);
            decklists.push(...tournamentDecklists);
        }
        return decklists;
    } catch (error) {
        console.error('Error fetching Limitless decks from recent tournaments:', error);
        return [];
    }
}


export { getLimitlessTournaments, 
         getLimitlessTournamentPlayers, 
         getLimitlessDecklist, 
         getLimitlessDecksFromTournament, 
         getLimitlessDecksFromRecentTournaments };