import { getDatabase } from './connection';
import { createEvent } from './events';

export async function seedDemoData(): Promise<void> {
    const db = await getDatabase();
    const alreadySeeded = await db.getFirstAsync(
        'SELECT id FROM events LIMIT 1'
    );
    if (alreadySeeded) return;

    const now = new Date();
    const future = (daysAhead: number, hour: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() + daysAhead);
        d.setHours(hour, 0, 0, 0);
        return d.toISOString();
    };
    const past = (daysAgo: number, hour: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        d.setHours(hour, 0, 0, 0);
        return d.toISOString();
    };

    const events = [
        {
            title: 'Conférence IA Générative',
            description: 'Présentation complète sur les LLMs, transformers et dernières avancées en IA générative. Venez découvrir GPT-4, Gemini et les modèles open-source.',
            category: 'Talk' as const,
            startDateTime: future(2, 14),
            endDateTime: future(2, 16),
            locationName: 'Amphi A',
            locationAddress: 'Bâtiment principal, campus central',
            organizerName: 'Club IA',
            capacity: 120,
            tags: ['intelligence artificielle', 'LLM', 'deep learning'],
        },
        {
            title: 'Workshop React Native',
            description: 'Atelier pratique pour apprendre à construire des applications mobiles multiplateformes avec React Native et Expo. Niveau intermédiaire requis.',
            category: 'Workshop' as const,
            startDateTime: future(4, 9),
            endDateTime: future(4, 13),
            locationName: 'Salle B12',
            locationAddress: 'Labo informatique, bâtiment B',
            organizerName: 'Association Dev Mobile',
            capacity: 30,
            tags: ['React Native', 'mobile', 'JavaScript', 'développement'],
        },
        {
            title: 'Forum Emploi Tech 2026',
            description: 'Rencontrez les recruteurs des meilleures entreprises tech du Maroc. CV, entretiens et networking. Préparez votre pitch !',
            category: 'Other' as const,
            startDateTime: future(11, 9),
            endDateTime: future(11, 17),
            locationName: 'Hall principal',
            locationAddress: 'Accueil principal du campus',
            organizerName: 'Service Carrières',
            capacity: 300,
            tags: ['emploi', 'recrutement', 'networking', 'stage', 'carrière'],
        },
        {
            title: 'Club Photo — Sortie Tanger',
            description: 'Sortie photo en ville. Thème : architecture et patrimoine. Ouvert à tous niveaux. Apportez votre appareil !',
            category: 'Club' as const,
            startDateTime: future(6, 10),
            locationName: 'Grand Socco',
            locationAddress: 'Place du Grand Socco, Tanger',
            organizerName: 'Club Photo Campus',
            tags: ['photographie', 'sortie', 'art'],
        },
        {
            title: 'Workshop Machine Learning avec TensorFlow',
            description: 'Session pratique sur la construction de modèles ML avec TensorFlow et Keras. Regression, classification, réseaux de neurones.',
            category: 'Workshop' as const,
            startDateTime: future(18, 14),
            endDateTime: future(18, 18),
            locationName: 'Salle B12',
            locationAddress: 'Labo informatique, bâtiment B',
            organizerName: 'Club IA',
            capacity: 25,
            tags: ['machine learning', 'TensorFlow', 'deep learning', 'Python'],
        },
        {
            title: 'Conférence Cloud AWS & Azure',
            description: 'Introduction aux services cloud : déploiement, serverless, stockage, et bonnes pratiques DevOps sur AWS et Azure.',
            category: 'Talk' as const,
            startDateTime: future(27, 14),
            endDateTime: future(27, 16),
            locationName: 'Amphi B',
            locationAddress: 'Bâtiment principal, campus central',
            organizerName: 'Club DevOps',
            capacity: 80,
            tags: ['cloud', 'AWS', 'Azure', 'DevOps'],
        },
        {
            title: 'Hackathon IA',
            description: "24h pour développer une solution innovante utilisant des APIs d'IA.Prix en jeu et mentorat par des professionnels.",
            category: 'Workshop' as const,
            startDateTime: future(9, 19),
            endDateTime: future(10, 19),
            locationName: 'Salle polyvalente',
            locationAddress: 'Bâtiment C, salle C01',
            organizerName: 'Association Étudiants Ingénieurs',
            capacity: 50,
            tags: ['hackathon', 'IA', 'compétition', '24h', 'innovation'],
        },
        {
            title: 'Atelier DevOps & Docker',
            description: 'Atelier hands-on sur la conteneurisation avec Docker, Docker Compose et introduction à Kubernetes. Créneau matinal disponible.',
            category: 'Workshop' as const,
            startDateTime: future(14, 9),
            endDateTime: future(14, 12),
            locationName: 'Salle B14',
            locationAddress: 'Labo informatique, bâtiment B',
            organizerName: 'Club DevOps',
            capacity: 20,
            tags: ['Docker', 'DevOps', 'Kubernetes', 'conteneurisation'],
        },
        {
            title: 'Conférence passée — Blockchain',
            description: 'Présentation sur les technologies blockchain, DeFi et applications décentralisées. Retrouvez le replay sur la chaîne YouTube du club.',
            category: 'Talk' as const,
            startDateTime: past(7, 14),
            endDateTime: past(7, 16),
            locationName: 'Amphi A',
            locationAddress: 'Bâtiment principal',
            organizerName: 'Club Crypto',
            capacity: 100,
            tags: ['blockchain', 'crypto', 'DeFi'],
        },
        {
            title: 'Workshop Python pour les données',
            description: 'Introduction à l\'analyse de données avec Python, Pandas et Matplotlib. Atelier passé — supports disponibles sur le portail étudiants.',
            category: 'Workshop' as const,
            startDateTime: past(3, 14),
            endDateTime: past(3, 17),
            locationName: 'Salle B10',
            locationAddress: 'Labo informatique, bâtiment B',
            organizerName: 'Club Data Science',
            capacity: 30,
            tags: ['Python', 'data science', 'Pandas', 'analyse de données'],
        },
    ];

    for (const e of events) {
        await createEvent(e);
    }
}
