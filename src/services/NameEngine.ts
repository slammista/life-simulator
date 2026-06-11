import type { Gender } from '../store/types'

// Per-nation name pools. Names adapt to the nation where the character lives.

interface NamePool {
  male: string[]
  female: string[]
  surnames: string[]
}

const POOLS: Record<string, NamePool> = {
  italy: {
    male: ['Marco', 'Luca', 'Andrea', 'Matteo', 'Francesco', 'Alessandro', 'Davide', 'Riccardo', 'Stefano', 'Lorenzo', 'Giovanni', 'Emanuele', 'Fabio', 'Paolo', 'Roberto', 'Giorgio', 'Antonio', 'Nicola', 'Filippo', 'Enrico', 'Tommaso', 'Pietro', 'Salvatore', 'Vincenzo', 'Dario', 'Claudio', 'Massimo', 'Edoardo', 'Gabriele', 'Diego'],
    female: ['Sara', 'Giulia', 'Martina', 'Valentina', 'Alessia', 'Chiara', 'Federica', 'Laura', 'Elena', 'Sofia', 'Francesca', 'Michela', 'Roberta', 'Paola', 'Monica', 'Ilaria', 'Serena', 'Daniela', 'Elisa', 'Anna', 'Giorgia', 'Beatrice', 'Camilla', 'Noemi', 'Aurora', 'Ginevra', 'Vittoria', 'Greta', 'Irene', 'Caterina'],
    surnames: ['Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Fontana', 'Giordano', 'Russo', 'Barbieri', 'Ferrara', 'Rinaldi', 'Caruso', 'Leone', 'Longo', 'Gentile', 'Lombardi', 'Serra', 'Vitale', 'Martini', 'Pellegrini'],
  },
  usa: {
    male: ['James', 'Michael', 'William', 'David', 'John', 'Robert', 'Daniel', 'Matthew', 'Christopher', 'Andrew', 'Joshua', 'Ethan', 'Tyler', 'Brandon', 'Kevin', 'Jason', 'Eric', 'Ryan', 'Jacob', 'Nathan'],
    female: ['Emily', 'Jessica', 'Ashley', 'Sarah', 'Amanda', 'Jennifer', 'Elizabeth', 'Megan', 'Lauren', 'Rachel', 'Samantha', 'Hannah', 'Taylor', 'Madison', 'Olivia', 'Emma', 'Abigail', 'Brittany', 'Nicole', 'Grace'],
    surnames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker'],
  },
  germany: {
    male: ['Lukas', 'Maximilian', 'Felix', 'Paul', 'Jonas', 'Leon', 'Tim', 'Niklas', 'Jan', 'Florian', 'Tobias', 'Sebastian', 'Philipp', 'Moritz', 'Hannes', 'Stefan', 'Markus', 'Andreas', 'Thomas', 'Christian'],
    female: ['Anna', 'Lena', 'Laura', 'Julia', 'Sophie', 'Marie', 'Lisa', 'Sarah', 'Hannah', 'Katharina', 'Johanna', 'Franziska', 'Clara', 'Amelie', 'Charlotte', 'Nele', 'Mia', 'Emma', 'Leonie', 'Greta'],
    surnames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Braun', 'Zimmermann', 'Krüger'],
  },
  japan: {
    male: ['Haruto', 'Yuto', 'Sota', 'Ren', 'Hiroshi', 'Takeshi', 'Kenji', 'Daiki', 'Kaito', 'Riku', 'Shota', 'Kenta', 'Yuki', 'Takumi', 'Ryo', 'Satoshi', 'Akira', 'Naoki', 'Tatsuya', 'Masashi'],
    female: ['Yui', 'Aoi', 'Hina', 'Sakura', 'Miyu', 'Rin', 'Yuna', 'Akari', 'Mei', 'Hana', 'Ayaka', 'Misaki', 'Nanami', 'Kaori', 'Haruka', 'Ayumi', 'Emi', 'Natsuki', 'Yuka', 'Mio'],
    surnames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Saito', 'Mori'],
  },
  brazil: {
    male: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Mateus', 'Rafael', 'Gustavo', 'Felipe', 'Bruno', 'Thiago', 'Diego', 'Vinicius', 'Leonardo', 'Eduardo', 'Henrique', 'Caio', 'André', 'Marcelo', 'Rodrigo', 'Fernando'],
    female: ['Maria', 'Ana', 'Juliana', 'Camila', 'Beatriz', 'Larissa', 'Fernanda', 'Amanda', 'Leticia', 'Gabriela', 'Mariana', 'Carolina', 'Isabela', 'Luiza', 'Bruna', 'Natália', 'Vitória', 'Rafaela', 'Patricia', 'Aline'],
    surnames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Araújo', 'Ribeiro', 'Gomes', 'Martins', 'Barbosa', 'Rocha', 'Dias', 'Moreira'],
  },
  sweden: {
    male: ['Erik', 'Lars', 'Karl', 'Anders', 'Johan', 'Per', 'Nils', 'Oskar', 'Gustav', 'Axel', 'Emil', 'Viktor', 'Filip', 'Anton', 'Hugo', 'Elias', 'Linus', 'Mattias', 'Henrik', 'Fredrik'],
    female: ['Anna', 'Eva', 'Maria', 'Karin', 'Sara', 'Emma', 'Linnea', 'Elin', 'Hanna', 'Johanna', 'Ida', 'Matilda', 'Ebba', 'Alva', 'Wilma', 'Agnes', 'Klara', 'Astrid', 'Freja', 'Stina'],
    surnames: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson', 'Lindberg', 'Lindqvist', 'Axelsson', 'Berg', 'Lundgren'],
  },
  ukraine: {
    male: ['Oleksandr', 'Dmytro', 'Andriy', 'Serhiy', 'Mykola', 'Ivan', 'Vasyl', 'Yuriy', 'Volodymyr', 'Taras', 'Bohdan', 'Petro', 'Maksym', 'Artem', 'Denys', 'Roman', 'Vitaliy', 'Oleh', 'Pavlo', 'Stepan'],
    female: ['Olena', 'Oksana', 'Tetiana', 'Nataliya', 'Iryna', 'Svitlana', 'Kateryna', 'Yuliya', 'Anna', 'Mariya', 'Viktoriya', 'Lyudmyla', 'Halyna', 'Daryna', 'Sofiya', 'Anastasiya', 'Olha', 'Larysa', 'Inna', 'Zoryana'],
    surnames: ['Shevchenko', 'Bondarenko', 'Kovalenko', 'Boyko', 'Tkachenko', 'Kravchenko', 'Oliynyk', 'Shevchuk', 'Polishchuk', 'Lysenko', 'Melnyk', 'Rudenko', 'Marchenko', 'Moroz', 'Pavlenko', 'Savchenko', 'Petrenko', 'Kovalchuk', 'Romanenko', 'Tkachuk'],
  },
  france: {
    male: ['Lucas', 'Hugo', 'Louis', 'Gabriel', 'Arthur', 'Jules', 'Théo', 'Nathan', 'Antoine', 'Maxime', 'Pierre', 'Nicolas', 'Julien', 'Alexandre', 'Thomas', 'Romain', 'Clément', 'Baptiste', 'Quentin', 'Mathis'],
    female: ['Emma', 'Léa', 'Chloé', 'Manon', 'Camille', 'Sarah', 'Inès', 'Jade', 'Louise', 'Zoé', 'Julie', 'Marion', 'Pauline', 'Mathilde', 'Claire', 'Charlotte', 'Margaux', 'Élise', 'Amandine', 'Lucie'],
    surnames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'],
  },
  spain: {
    male: ['Alejandro', 'Daniel', 'Pablo', 'David', 'Javier', 'Adrián', 'Diego', 'Mario', 'Sergio', 'Carlos', 'Miguel', 'Antonio', 'Manuel', 'Jorge', 'Álvaro', 'Raúl', 'Iván', 'Rubén', 'Fernando', 'Andrés'],
    female: ['Lucía', 'María', 'Paula', 'Sara', 'Carla', 'Claudia', 'Sofía', 'Alba', 'Julia', 'Noelia', 'Marta', 'Elena', 'Laura', 'Cristina', 'Carmen', 'Ana', 'Raquel', 'Beatriz', 'Patricia', 'Silvia'],
    surnames: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez'],
  },
  uk: {
    male: ['Oliver', 'Harry', 'Jack', 'George', 'Charlie', 'Thomas', 'Oscar', 'William', 'James', 'Henry', 'Alfie', 'Archie', 'Edward', 'Joseph', 'Samuel', 'Daniel', 'Benjamin', 'Lewis', 'Callum', 'Finlay'],
    female: ['Olivia', 'Amelia', 'Isla', 'Emily', 'Poppy', 'Ava', 'Sophie', 'Charlotte', 'Grace', 'Lily', 'Freya', 'Evie', 'Daisy', 'Florence', 'Alice', 'Phoebe', 'Holly', 'Imogen', 'Rosie', 'Megan'],
    surnames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green', 'Hall', 'Wood', 'Jackson', 'Clarke'],
  },
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function getPool(nationality: string | undefined): NamePool {
  return POOLS[nationality ?? 'italy'] ?? POOLS.italy
}

export class NameEngine {
  // Set at newGame / save-load so engines without state access generate names for the right country
  private static currentNationality = 'italy'

  static setNationality(nationality: string | undefined) {
    if (nationality && POOLS[nationality]) this.currentNationality = nationality
  }

  static firstName(gender: Gender, nationality?: string): string {
    const pool = getPool(nationality ?? this.currentNationality)
    return pick(gender === 'female' ? pool.female : pool.male)
  }

  static surname(nationality?: string): string {
    return pick(getPool(nationality ?? this.currentNationality).surnames)
  }

  static fullName(gender: Gender, nationality?: string): string {
    const nat = nationality ?? this.currentNationality
    return `${this.firstName(gender, nat)} ${this.surname(nat)}`
  }
}
