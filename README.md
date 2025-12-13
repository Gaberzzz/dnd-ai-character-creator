# D&D AI Character Creator

An AI-powered D&D 5e character generator with an interactive, D&D Beyond-style character sheet UI built with React Router and React.

## Features

- 🤖 **AI-Powered Generation**: Generate complete D&D 5e characters using OpenRouter AI with a simple text prompt
- 📋 **Interactive Character Sheet**: View and edit character details in a beautifully designed D&D Beyond-inspired UI
- 🎨 **Dark Theme UI**: Orange and gray color scheme matching the classic D&D Beyond aesthetic
- ✏️ **Full Editability**: Modify all character stats, skills, proficiencies, equipment, and traits
- 📊 **Comprehensive Character Data**: Includes ability scores, skills, saving throws, attacks, inventory, and personality traits
- 🎯 **Tab-Based Organization**: Actions, Spells, Inventory, and Features tabs for organized character information
- 📄 **Responsive Design**: Works seamlessly on desktop and tablet displays

## Components

### Routes
- **`/character-generator`** - Main character generation interface. Input API key and character description to generate new characters.
- **`/character-sheet`** - Interactive character sheet display (accessed after generation)

### Sub-Components (`app/components/`)
- **`AbilityScoreBox.tsx`** - Displays ability scores (STR, DEX, CON, INT, WIS, CHA) with modifiers
- **`SkillRow.tsx`** - Individual skill row with proficiency checkbox and value input
- **`SavingThrowSection.tsx`** - Organized saving throws with proficiency toggles
- **`AttackEntry.tsx`** - Weapon/attack entries with attack bonus and damage fields

## Getting Started

### Installation

Install dependencies with pnpm (or npm/yarn):

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

Create a production build:

```bash
pnpm run build
```

## Usage

1. **Navigate to the Character Generator** (`/character-generator`)
2. **Enter your OpenRouter API Key** - Get one free at [openrouter.ai](https://openrouter.ai/app/keys)
3. **Describe your character** - E.g., "A cunning rogue with a mysterious past" or "A noble fighter with high charisma"
4. **Click "Generate Character"** - AI will create a complete D&D 5e character
5. **View the Character Sheet** - Automatically opens the interactive character sheet
6. **Edit as needed** - Click the "Edit" button to modify any character stats
7. **Save your changes** - Click the "Save" button to persist edits

## Character Sheet Features

### Left Sidebar
- **Ability Scores**: STR, DEX, CON, INT, WIS, CHA with modifiers
- **Quick Stats**: AC, Initiative, Hit Points (current/max/temp)
- **Other Stats**: Speed, Proficiency Bonus, Hit Dice
- **Saving Throws**: All 6 ability saves with proficiency toggles

### Center Area
- **Skills**: All 18 D&D 5e skills with proficiency toggles and bonus values
- **Tabs**:
  - **Actions**: Weapons and attacks with attack bonuses and damage
  - **Spells**: Placeholder for spell list (expandable feature)
  - **Inventory**: Currency (CP, SP, EP, GP, PP) and equipment list
  - **Features**: Class features, racial traits, and other special abilities

### Right Sidebar
- **Character Details**: Alignment and Experience Points
- **Personality Traits**: Personality, Ideals, Bonds, and Flaws

## Technologies Used

- **React 19** - UI framework
- **React Router 7** - Routing and SSR
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool
- **OpenRouter API** - AI character generation

## Environment Setup

Create a `.env` file (optional) or provide your OpenRouter API key in the application UI:

```
VITE_OPENROUTER_API_KEY=your_api_key_here
```

## Future Enhancements

- [ ] PDF export with filled character sheet
- [ ] Character sheet persistence (database/localStorage)
- [ ] Multi-character management
- [ ] Spell selection and management
- [ ] Advanced action economy tracking
- [ ] Dice roller integration
- [ ] Character sharing and collaboration
- [ ] Import from D&D Beyond JSON

## API Integration

### Character Generation Endpoint

The app uses `/api/character` endpoint (via `app/routes/api.character.tsx`) to:
1. Receive the character prompt and user's OpenRouter API key
2. Forward the request to OpenRouter's Claude model
3. Parse and return the generated character JSON

## License

This project is open source and available under the MIT License.

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
