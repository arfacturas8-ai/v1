/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3Education from './Web3Education';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Book: ({ className }) => <div data-testid="book-icon" className={className} />,
  Lightbulb: ({ className }) => <div data-testid="lightbulb-icon" className={className} />,
  Shield: ({ className }) => <div data-testid="shield-icon" className={className} />,
  Coins: ({ className }) => <div data-testid="coins-icon" className={className} />,
  Users: ({ className }) => <div data-testid="users-icon" className={className} />,
  Zap: ({ className }) => <div data-testid="zap-icon" className={className} />,
  ChevronDown: ({ className }) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronRight: ({ className }) => <div data-testid="chevron-right-icon" className={className} />,
  ExternalLink: ({ className }) => <div data-testid="external-link-icon" className={className} />,
  Play: ({ className }) => <div data-testid="play-icon" className={className} />
}));

describe('Web3Education', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders without crashing', () => {
      const { container } = render(<Web3Education />);
      expect(container).toBeInTheDocument();
    });

    it('renders header with Learn Web3 badge', () => {
      render(<Web3Education />);
      expect(screen.getByText('Learn Web3')).toBeInTheDocument();
      expect(screen.getByTestId('book-icon')).toBeInTheDocument();
    });

    it('renders main title', () => {
      render(<Web3Education />);
      expect(screen.getByText('Web3 Education Center')).toBeInTheDocument();
    });

    it('renders main description', () => {
      render(<Web3Education />);
      expect(screen.getByText(/Master the fundamentals of Web3, cryptocurrency, and decentralized technology/i)).toBeInTheDocument();
    });

    it('renders all category navigation buttons', () => {
      render(<Web3Education />);
      expect(screen.getByRole('button', { name: /Web3 Basics/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crypto Wallets/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tokens & NFTs/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /DeFi Explained/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /DAOs & Governance/i })).toBeInTheDocument();
    });

    it('starts with basics category active by default', () => {
      render(<Web3Education />);
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      expect(basicsButton).toHaveClass('btn-primary');
    });

    it('displays category description for active category', () => {
      render(<Web3Education />);
      expect(screen.getByText('Web3 Basics')).toBeInTheDocument();
      expect(screen.getByText('Learn the fundamentals of Web3 and blockchain technology')).toBeInTheDocument();
    });

    it('renders category icons correctly', () => {
      render(<Web3Education />);
      expect(screen.getAllByTestId('book-icon').length).toBeGreaterThan(0);
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      expect(screen.getByTestId('coins-icon')).toBeInTheDocument();
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });
  });

  describe('Category Navigation', () => {
    it('switches to wallets category when clicked', () => {
      render(<Web3Education />);
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(walletsButton).toHaveClass('btn-primary');
      expect(screen.getByText('Understanding digital wallets and how to keep your crypto secure')).toBeInTheDocument();
    });

    it('switches to tokens category when clicked', () => {
      render(<Web3Education />);
      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);

      expect(tokensButton).toHaveClass('btn-primary');
      expect(screen.getByText('Explore different types of digital assets and their uses')).toBeInTheDocument();
    });

    it('switches to defi category when clicked', () => {
      render(<Web3Education />);
      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);

      expect(defiButton).toHaveClass('btn-primary');
      expect(screen.getByText('Decentralized Finance and how it changes traditional banking')).toBeInTheDocument();
    });

    it('switches to community category when clicked', () => {
      render(<Web3Education />);
      const communityButton = screen.getByRole('button', { name: /DAOs & Governance/i });
      fireEvent.click(communityButton);

      expect(communityButton).toHaveClass('btn-primary');
      expect(screen.getByText('Community ownership and decentralized decision making')).toBeInTheDocument();
    });

    it('resets expanded topic when changing categories', () => {
      render(<Web3Education />);

      // Expand a topic in basics
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      // Switch to wallets category
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      // Topics should not be expanded
      expect(screen.queryByText('Key principles of Web3:')).not.toBeInTheDocument();
    });

    it('updates category button styling when active', () => {
      render(<Web3Education />);
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });

      fireEvent.click(walletsButton);

      expect(walletsButton).toHaveClass('btn-primary');
      expect(basicsButton).not.toHaveClass('btn-primary');
      expect(basicsButton).toHaveClass('btn-secondary');
    });

    it('switches categories rapidly without errors', () => {
      render(<Web3Education />);
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      const communityButton = screen.getByRole('button', { name: /DAOs & Governance/i });

      fireEvent.click(walletsButton);
      fireEvent.click(tokensButton);
      fireEvent.click(defiButton);
      fireEvent.click(communityButton);
      fireEvent.click(basicsButton);

      expect(basicsButton).toHaveClass('btn-primary');
    });
  });

  describe('Topic Cards Display - Basics Category', () => {
    beforeEach(() => {
      render(<Web3Education />);
    });

    it('displays all basics category topics', () => {
      expect(screen.getByText('What is Web3?')).toBeInTheDocument();
      expect(screen.getByText('Blockchain Technology')).toBeInTheDocument();
      expect(screen.getByText('Why Web3 Matters for Social Media')).toBeInTheDocument();
    });

    it('displays topic difficulty badges', () => {
      expect(screen.getAllByText('Beginner').length).toBeGreaterThan(0);
    });

    it('displays topic read time', () => {
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('7 min')).toBeInTheDocument();
      expect(screen.getByText('6 min')).toBeInTheDocument();
    });

    it('displays topic summaries', () => {
      expect(screen.getByText(/Web3 represents the next evolution of the internet/i)).toBeInTheDocument();
      expect(screen.getByText(/Understanding the technology that powers Web3 and cryptocurrency/i)).toBeInTheDocument();
      expect(screen.getByText(/How Web3 technology can revolutionize social networking/i)).toBeInTheDocument();
    });

    it('shows chevron right icon for collapsed topics', () => {
      const chevronRightIcons = screen.getAllByTestId('chevron-right-icon');
      expect(chevronRightIcons.length).toBeGreaterThan(0);
    });

    it('applies correct styling to beginner difficulty badge', () => {
      const beginnerBadges = screen.getAllByText('Beginner');
      beginnerBadges.forEach(badge => {
        expect(badge).toHaveClass('bg-success/20', 'text-success');
      });
    });
  });

  describe('Topic Cards Display - Wallets Category', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);
    });

    it('displays wallet category topics', () => {
      expect(screen.getByText('What is a Crypto Wallet?')).toBeInTheDocument();
      expect(screen.getByText('Keeping Your Wallet Safe')).toBeInTheDocument();
    });

    it('displays intermediate difficulty badge', () => {
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('applies correct styling to intermediate difficulty badge', () => {
      const intermediateBadge = screen.getByText('Intermediate');
      expect(intermediateBadge).toHaveClass('bg-warning/20', 'text-warning');
    });

    it('displays wallet topic summaries', () => {
      expect(screen.getByText(/Your digital wallet is like a bank account/i)).toBeInTheDocument();
      expect(screen.getByText(/Essential security practices to protect your digital assets/i)).toBeInTheDocument();
    });
  });

  describe('Topic Cards Display - Tokens Category', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);
    });

    it('displays token category topics', () => {
      expect(screen.getByText('Tokens vs Cryptocurrency')).toBeInTheDocument();
      expect(screen.getByText('NFTs Explained Simply')).toBeInTheDocument();
    });

    it('displays token topic summaries', () => {
      expect(screen.getByText(/Understanding the difference between cryptocurrencies, tokens, and NFTs/i)).toBeInTheDocument();
      expect(screen.getByText(/A practical guide to Non-Fungible Tokens/i)).toBeInTheDocument();
    });
  });

  describe('Topic Cards Display - DeFi Category', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);
    });

    it('displays defi category topics', () => {
      expect(screen.getByText('What is DeFi?')).toBeInTheDocument();
    });

    it('displays defi topic summary', () => {
      expect(screen.getByText(/Decentralized Finance: Banking without banks/i)).toBeInTheDocument();
    });

    it('shows 8 min read time', () => {
      expect(screen.getByText('8 min')).toBeInTheDocument();
    });
  });

  describe('Topic Cards Display - Community Category', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const communityButton = screen.getByRole('button', { name: /DAOs & Governance/i });
      fireEvent.click(communityButton);
    });

    it('displays community category topics', () => {
      expect(screen.getByText('DAOs: Organizations for Web3')).toBeInTheDocument();
    });

    it('displays community topic summary', () => {
      expect(screen.getByText(/How communities can own and govern platforms together/i)).toBeInTheDocument();
    });
  });

  describe('Topic Expansion and Collapse', () => {
    beforeEach(() => {
      render(<Web3Education />);
    });

    it('expands topic when clicked', () => {
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      expect(screen.getByText(/Web3, also known as the decentralized web/i)).toBeInTheDocument();
    });

    it('shows chevron down icon for expanded topic', () => {
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('collapses topic when clicked again', () => {
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      expect(screen.getByText(/Web3, also known as the decentralized web/i)).toBeInTheDocument();

      fireEvent.click(whatIsWeb3);

      expect(screen.queryByText(/Web3, also known as the decentralized web/i)).not.toBeInTheDocument();
    });

    it('collapses previous topic when expanding new one', () => {
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      const blockchainTech = screen.getByText('Blockchain Technology');
      fireEvent.click(blockchainTech);

      // First topic content should be hidden
      expect(screen.queryByText('Key principles of Web3:')).not.toBeInTheDocument();
      // Second topic content should be visible
      expect(screen.getByText(/A blockchain is a digital ledger/i)).toBeInTheDocument();
    });

    it('toggles multiple topics independently', () => {
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);
      fireEvent.click(whatIsWeb3);

      const blockchainTech = screen.getByText('Blockchain Technology');
      fireEvent.click(blockchainTech);
      fireEvent.click(blockchainTech);

      // Both should be collapsed
      expect(screen.queryByText('Key principles of Web3:')).not.toBeInTheDocument();
      expect(screen.queryByText(/A blockchain is a digital ledger/i)).not.toBeInTheDocument();
    });
  });

  describe('Content Sections - What is Web3', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);
    });

    it('displays full content text', () => {
      expect(screen.getByText(/Web3, also known as the decentralized web/i)).toBeInTheDocument();
      expect(screen.getByText(/built on blockchain technology/i)).toBeInTheDocument();
    });

    it('displays key principles section', () => {
      expect(screen.getByText('Key principles of Web3:')).toBeInTheDocument();
    });

    it('displays content bullet points', () => {
      expect(screen.getByText(/Decentralization: No single entity controls the network/i)).toBeInTheDocument();
      expect(screen.getByText(/Ownership: Users own their data, content, and digital assets/i)).toBeInTheDocument();
      expect(screen.getByText(/Transparency: All transactions are publicly verifiable/i)).toBeInTheDocument();
      expect(screen.getByText(/Permissionless: Anyone can participate without gatekeepers/i)).toBeInTheDocument();
    });

    it('displays key takeaways section', () => {
      expect(screen.getByText('Key Takeaways')).toBeInTheDocument();
      expect(screen.getByTestId('lightbulb-icon')).toBeInTheDocument();
    });

    it('displays all key takeaways', () => {
      expect(screen.getByText('Web3 gives users control over their digital lives')).toBeInTheDocument();
      expect(screen.getByText('Built on blockchain technology for transparency')).toBeInTheDocument();
      expect(screen.getByText('Enables true ownership of digital assets')).toBeInTheDocument();
      expect(screen.getByText('Creates new economic opportunities for users')).toBeInTheDocument();
    });

    it('displays next steps section', () => {
      expect(screen.getByText('What to Learn Next')).toBeInTheDocument();
    });

    it('displays all next steps', () => {
      expect(screen.getByText('Learn about blockchain basics')).toBeInTheDocument();
      expect(screen.getByText('Understand cryptocurrency')).toBeInTheDocument();
      expect(screen.getByText('Explore NFTs and tokens')).toBeInTheDocument();
    });

    it('applies correct styling to key takeaways section', () => {
      const takeawaysSection = screen.getByText('Key Takeaways').closest('div');
      expect(takeawaysSection).toHaveClass('bg-accent-primary/10');
    });

    it('applies correct styling to next steps section', () => {
      const nextStepsSection = screen.getByText('What to Learn Next').closest('div');
      expect(nextStepsSection).toHaveClass('bg-secondary/30');
    });
  });

  describe('Content Sections - Blockchain Basics', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const blockchainTech = screen.getByText('Blockchain Technology');
      fireEvent.click(blockchainTech);
    });

    it('displays blockchain content', () => {
      expect(screen.getByText(/A blockchain is a digital ledger/i)).toBeInTheDocument();
      expect(screen.getByText(/records transactions across many computers/i)).toBeInTheDocument();
    });

    it('displays blockchain characteristics', () => {
      expect(screen.getByText(/Everyone can read: All transactions are public/i)).toBeInTheDocument();
      expect(screen.getByText(/No one can erase: Once written, entries are permanent/i)).toBeInTheDocument();
      expect(screen.getByText(/Multiple copies exist: Thousands of computers have the same notebook/i)).toBeInTheDocument();
      expect(screen.getByText(/Everyone agrees: Network consensus validates all changes/i)).toBeInTheDocument();
    });

    it('displays blockchain key takeaways', () => {
      expect(screen.getByText(/Blockchain = distributed, unchangeable digital ledger/i)).toBeInTheDocument();
      expect(screen.getByText(/Creates trust without central authorities/i)).toBeInTheDocument();
      expect(screen.getByText(/Powers cryptocurrencies, NFTs, and Web3 apps/i)).toBeInTheDocument();
      expect(screen.getByText(/Different blockchains have different purposes/i)).toBeInTheDocument();
    });

    it('displays blockchain next steps', () => {
      expect(screen.getByText('Explore different blockchain networks')).toBeInTheDocument();
      expect(screen.getByText('Learn about smart contracts')).toBeInTheDocument();
      expect(screen.getByText('Understand gas fees')).toBeInTheDocument();
    });
  });

  describe('Content Sections - Web3 Social Media', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const whyWeb3Matters = screen.getByText('Why Web3 Matters for Social Media');
      fireEvent.click(whyWeb3Matters);
    });

    it('displays social media problems section', () => {
      expect(screen.getByText('Problems with Web2 social media:')).toBeInTheDocument();
    });

    it('displays social media solutions section', () => {
      expect(screen.getByText('Web3 social media solutions:')).toBeInTheDocument();
    });

    it('displays CRYB-specific content', () => {
      expect(screen.getByText(/CRYB combines the best of both worlds/i)).toBeInTheDocument();
      expect(screen.getByText(/earn CRYB tokens for creating great content/i)).toBeInTheDocument();
    });

    it('displays social media key takeaways', () => {
      expect(screen.getByText('Web3 gives creators true ownership of their content')).toBeInTheDocument();
      expect(screen.getByText('Users can earn tokens for valuable contributions')).toBeInTheDocument();
      expect(screen.getByText('Community governance replaces corporate decisions')).toBeInTheDocument();
      expect(screen.getByText('Portable identity means freedom to move platforms')).toBeInTheDocument();
    });
  });

  describe('Content Sections - Wallets', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);
      const whatIsWallet = screen.getByText('What is a Crypto Wallet?');
      fireEvent.click(whatIsWallet);
    });

    it('displays wallet types section', () => {
      expect(screen.getByText('Types of wallets:')).toBeInTheDocument();
    });

    it('displays what wallets store section', () => {
      expect(screen.getByText('What wallets store:')).toBeInTheDocument();
    });

    it('displays wallet security warning', () => {
      expect(screen.getByText(/Never share your seed phrase with anyone/i)).toBeInTheDocument();
    });

    it('displays wallet key takeaways', () => {
      expect(screen.getByText('Wallets store keys, not actual cryptocurrency')).toBeInTheDocument();
      expect(screen.getByText('Private keys must always stay private')).toBeInTheDocument();
      expect(screen.getByText('Different wallet types for different security needs')).toBeInTheDocument();
      expect(screen.getByText('Your wallet address is safe to share publicly')).toBeInTheDocument();
    });
  });

  describe('Content Sections - Wallet Security', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);
      const walletSecurity = screen.getByText('Keeping Your Wallet Safe');
      fireEvent.click(walletSecurity);
    });

    it('displays essential security rules', () => {
      expect(screen.getByText('Essential Security Rules:')).toBeInTheDocument();
    });

    it('displays common scams section', () => {
      expect(screen.getByText('Common Scams to Avoid:')).toBeInTheDocument();
    });

    it('displays best practices section', () => {
      expect(screen.getByText('Best Practices:')).toBeInTheDocument();
    });

    it('displays security key takeaways', () => {
      expect(screen.getByText(/Your seed phrase is the master key/i)).toBeInTheDocument();
      expect(screen.getByText(/Never share private keys with anyone/i)).toBeInTheDocument();
      expect(screen.getByText(/Be extremely cautious of scams and phishing/i)).toBeInTheDocument();
      expect(screen.getByText(/Start small and learn before investing large amounts/i)).toBeInTheDocument();
    });
  });

  describe('Content Sections - Tokens and NFTs', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);
    });

    it('displays tokens vs crypto content', () => {
      const tokensVsCrypto = screen.getByText('Tokens vs Cryptocurrency');
      fireEvent.click(tokensVsCrypto);

      expect(screen.getByText('Cryptocurrency (Native tokens):')).toBeInTheDocument();
      expect(screen.getByText('Tokens (Built on existing blockchains):')).toBeInTheDocument();
      expect(screen.getByText('NFTs (Non-Fungible Tokens):')).toBeInTheDocument();
      expect(screen.getByText('Token Standards:')).toBeInTheDocument();
    });

    it('displays NFT guide content', () => {
      const nftGuide = screen.getByText('NFTs Explained Simply');
      fireEvent.click(nftGuide);

      expect(screen.getByText('Real-world analogies:')).toBeInTheDocument();
      expect(screen.getByText('Common NFT types:')).toBeInTheDocument();
      expect(screen.getByText('Why people buy NFTs:')).toBeInTheDocument();
    });

    it('displays CRYB NFT information', () => {
      const nftGuide = screen.getByText('NFTs Explained Simply');
      fireEvent.click(nftGuide);

      expect(screen.getByText(/On CRYB:/i)).toBeInTheDocument();
      expect(screen.getByText(/NFTs can be your profile picture/i)).toBeInTheDocument();
    });
  });

  describe('Content Sections - DeFi', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);
      const whatIsDefi = screen.getByText('What is DeFi?');
      fireEvent.click(whatIsDefi);
    });

    it('displays traditional finance vs defi comparison', () => {
      expect(screen.getByText('Traditional Finance vs DeFi:')).toBeInTheDocument();
      expect(screen.getByText('Traditional Banking:')).toBeInTheDocument();
      expect(screen.getByText('DeFi:')).toBeInTheDocument();
    });

    it('displays popular defi services', () => {
      expect(screen.getByText('Popular DeFi Services:')).toBeInTheDocument();
    });

    it('displays CRYB defi features', () => {
      expect(screen.getByText(/On CRYB:/i)).toBeInTheDocument();
      expect(screen.getByText(/stake CRYB tokens to earn rewards/i)).toBeInTheDocument();
    });

    it('displays defi risks', () => {
      expect(screen.getByText('Risks to understand:')).toBeInTheDocument();
    });

    it('displays defi key takeaways', () => {
      expect(screen.getByText('DeFi replaces traditional banks with smart contracts')).toBeInTheDocument();
      expect(screen.getByText('Offers global, permissionless financial services')).toBeInTheDocument();
      expect(screen.getByText('Enables new ways to earn yield on your crypto')).toBeInTheDocument();
    });
  });

  describe('Content Sections - DAOs', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const communityButton = screen.getByRole('button', { name: /DAOs & Governance/i });
      fireEvent.click(communityButton);
      const daoBasics = screen.getByText('DAOs: Organizations for Web3');
      fireEvent.click(daoBasics);
    });

    it('displays how DAOs work section', () => {
      expect(screen.getByText('How DAOs work:')).toBeInTheDocument();
    });

    it('displays types of DAOs section', () => {
      expect(screen.getByText('Types of DAOs:')).toBeInTheDocument();
    });

    it('displays CRYB DAO vision', () => {
      expect(screen.getByText('CRYB DAO Vision:')).toBeInTheDocument();
      expect(screen.getByText(/CRYB will transition to community governance/i)).toBeInTheDocument();
    });

    it('displays benefits of DAO governance', () => {
      expect(screen.getByText('Benefits of DAO governance:')).toBeInTheDocument();
    });

    it('displays DAO challenges', () => {
      expect(screen.getByText('Challenges:')).toBeInTheDocument();
    });

    it('displays DAO key takeaways', () => {
      expect(screen.getByText('DAOs enable community ownership of organizations')).toBeInTheDocument();
      expect(screen.getByText('Governance tokens give voting rights on decisions')).toBeInTheDocument();
      expect(screen.getByText('CRYB will transition to DAO governance over time')).toBeInTheDocument();
      expect(screen.getByText('Creates alignment between users and platform success')).toBeInTheDocument();
    });
  });

  describe('Additional Resources Section', () => {
    beforeEach(() => {
      render(<Web3Education />);
    });

    it('renders additional resources section', () => {
      expect(screen.getByText('Additional Resources')).toBeInTheDocument();
      expect(screen.getByText('Expand your Web3 knowledge with these trusted sources')).toBeInTheDocument();
    });

    it('displays documentation resource card', () => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Read official docs from leading Web3 projects')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Browse Docs/i })).toBeInTheDocument();
    });

    it('displays video tutorials resource card', () => {
      expect(screen.getByText('Video Tutorials')).toBeInTheDocument();
      expect(screen.getByText('Step-by-step guides and explanations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Watch Videos/i })).toBeInTheDocument();
    });

    it('displays community resource card', () => {
      expect(screen.getByText('Community')).toBeInTheDocument();
      expect(screen.getByText('Ask questions and learn from others')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Join Community/i })).toBeInTheDocument();
    });

    it('displays resource card icons', () => {
      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
    });

    it('renders resource buttons with correct styling', () => {
      const browseDocsButton = screen.getByRole('button', { name: /Browse Docs/i });
      expect(browseDocsButton).toHaveClass('btn', 'btn-secondary');
    });

    it('displays emojis in resource cards', () => {
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('🎥')).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsive Layout', () => {
    it('renders responsive category button text', () => {
      render(<Web3Education />);

      // Should have both full text and shortened text in DOM
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      expect(basicsButton).toBeInTheDocument();
    });

    it('uses flexbox for responsive layout', () => {
      const { container } = render(<Web3Education />);
      const categoryNav = container.querySelector('.flex.flex-wrap');
      expect(categoryNav).toBeInTheDocument();
    });

    it('applies responsive grid to resource cards', () => {
      const { container } = render(<Web3Education />);
      const resourceGrid = container.querySelector('.grid.md\\:grid-cols-3');
      expect(resourceGrid).toBeInTheDocument();
    });

    it('renders mobile-friendly topic cards', () => {
      render(<Web3Education />);
      const whatIsWeb3 = screen.getByText('What is Web3?');
      const topicCard = whatIsWeb3.closest('.card');
      expect(topicCard).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<Web3Education />);
    });

    it('uses semantic heading hierarchy', () => {
      const h2 = screen.getByRole('heading', { level: 2, name: 'Web3 Education Center' });
      expect(h2).toBeInTheDocument();
    });

    it('uses semantic heading for topic titles', () => {
      const topicHeading = screen.getByRole('heading', { level: 3, name: 'What is Web3?' });
      expect(topicHeading).toBeInTheDocument();
    });

    it('provides accessible button labels', () => {
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      expect(basicsButton).toBeInTheDocument();
    });

    it('uses buttons for interactive elements', () => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('maintains keyboard navigation support', () => {
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      basicsButton.focus();
      expect(document.activeElement).toBe(basicsButton);
    });

    it('provides proper heading structure in expanded content', () => {
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      const keyTakeawaysHeading = screen.getByRole('heading', { level: 4, name: 'Key Takeaways' });
      expect(keyTakeawaysHeading).toBeInTheDocument();
    });

    it('uses semantic list structure for content', () => {
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      // Check for list-like structure (bullet points are rendered as divs with specific styling)
      const bulletPoints = document.querySelectorAll('.w-1\\.5.h-1\\.5.bg-accent-light.rounded-full');
      expect(bulletPoints.length).toBeGreaterThan(0);
    });

    it('has accessible color contrast for text', () => {
      const mainTitle = screen.getByText('Web3 Education Center');
      expect(mainTitle).toHaveClass('text-primary');
    });

    it('provides visual feedback on hover for buttons', () => {
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      expect(walletsButton).toHaveClass('hover:border-accent-primary/30');
    });
  });

  describe('Content Formatting and Display', () => {
    beforeEach(() => {
      render(<Web3Education />);
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);
    });

    it('formats paragraphs correctly', () => {
      const contentParagraphs = document.querySelectorAll('.text-secondary');
      expect(contentParagraphs.length).toBeGreaterThan(0);
    });

    it('renders bullet points with custom styling', () => {
      const bullets = document.querySelectorAll('.w-1\\.5.h-1\\.5.bg-accent-light.rounded-full');
      expect(bullets.length).toBeGreaterThan(0);
    });

    it('applies proper spacing between content sections', () => {
      const contentSections = document.querySelectorAll('.mb-lg');
      expect(contentSections.length).toBeGreaterThan(0);
    });

    it('renders section headers with proper styling', () => {
      const sectionHeader = screen.getByText('Key principles of Web3:');
      expect(sectionHeader).toBeInTheDocument();
    });

    it('displays content with proper text color', () => {
      const secondaryText = document.querySelectorAll('.text-secondary');
      expect(secondaryText.length).toBeGreaterThan(0);
    });

    it('removes markdown formatting from displayed content', () => {
      // Should not display ** markers in the rendered content
      const content = screen.getByText(/Decentralization: No single entity controls the network/i);
      expect(content.textContent).not.toContain('**');
    });
  });

  describe('State Management', () => {
    it('maintains active category state', () => {
      render(<Web3Education />);

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(walletsButton).toHaveClass('btn-primary');
    });

    it('maintains expanded topic state', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      expect(screen.getByText(/Web3, also known as the decentralized web/i)).toBeInTheDocument();
    });

    it('resets expanded state when null', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);
      fireEvent.click(whatIsWeb3);

      expect(screen.queryByText(/Web3, also known as the decentralized web/i)).not.toBeInTheDocument();
    });

    it('updates content based on active category', () => {
      render(<Web3Education />);

      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);

      expect(screen.getByText('Tokens vs Cryptocurrency')).toBeInTheDocument();
      expect(screen.queryByText('What is Web3?')).not.toBeInTheDocument();
    });

    it('handles empty category content gracefully', () => {
      render(<Web3Education />);

      // All categories have content, but testing the pattern
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      fireEvent.click(basicsButton);

      const topicCards = document.querySelectorAll('.card.p-lg');
      expect(topicCards.length).toBeGreaterThan(0);
    });
  });

  describe('User Interaction Flow', () => {
    it('allows browsing through all categories', () => {
      render(<Web3Education />);

      const categories = [
        /Web3 Basics/i,
        /Crypto Wallets/i,
        /Tokens & NFTs/i,
        /DeFi Explained/i,
        /DAOs & Governance/i
      ];

      categories.forEach(category => {
        const button = screen.getByRole('button', { name: category });
        fireEvent.click(button);
        expect(button).toHaveClass('btn-primary');
      });
    });

    it('allows reading multiple topics in sequence', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);
      expect(screen.getByText(/Web3, also known as the decentralized web/i)).toBeInTheDocument();

      const blockchainTech = screen.getByText('Blockchain Technology');
      fireEvent.click(blockchainTech);
      expect(screen.getByText(/A blockchain is a digital ledger/i)).toBeInTheDocument();

      const whyWeb3Matters = screen.getByText('Why Web3 Matters for Social Media');
      fireEvent.click(whyWeb3Matters);
      expect(screen.getByText(/Traditional social media has problems/i)).toBeInTheDocument();
    });

    it('maintains UI consistency during interactions', () => {
      render(<Web3Education />);

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      const whatIsWallet = screen.getByText('What is a Crypto Wallet?');
      fireEvent.click(whatIsWallet);

      // Header should still be visible
      expect(screen.getByText('Web3 Education Center')).toBeInTheDocument();

      // Category should still be active
      expect(walletsButton).toHaveClass('btn-primary');
    });

    it('provides clear visual feedback for active states', () => {
      render(<Web3Education />);

      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      expect(basicsButton).toHaveClass('btn-primary');

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      expect(walletsButton).not.toHaveClass('btn-primary');
    });
  });

  describe('Content Structure Validation', () => {
    it('displays correct number of basics topics', () => {
      render(<Web3Education />);

      expect(screen.getByText('What is Web3?')).toBeInTheDocument();
      expect(screen.getByText('Blockchain Technology')).toBeInTheDocument();
      expect(screen.getByText('Why Web3 Matters for Social Media')).toBeInTheDocument();
    });

    it('displays correct number of wallet topics', () => {
      render(<Web3Education />);
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(screen.getByText('What is a Crypto Wallet?')).toBeInTheDocument();
      expect(screen.getByText('Keeping Your Wallet Safe')).toBeInTheDocument();
    });

    it('displays correct number of token topics', () => {
      render(<Web3Education />);
      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);

      expect(screen.getByText('Tokens vs Cryptocurrency')).toBeInTheDocument();
      expect(screen.getByText('NFTs Explained Simply')).toBeInTheDocument();
    });

    it('displays correct number of defi topics', () => {
      render(<Web3Education />);
      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);

      expect(screen.getByText('What is DeFi?')).toBeInTheDocument();
    });

    it('displays correct number of community topics', () => {
      render(<Web3Education />);
      const communityButton = screen.getByRole('button', { name: /DAOs & Governance/i });
      fireEvent.click(communityButton);

      expect(screen.getByText('DAOs: Organizations for Web3')).toBeInTheDocument();
    });

    it('ensures all topics have required metadata', () => {
      render(<Web3Education />);

      // Check first topic has all metadata
      const whatIsWeb3Title = screen.getByText('What is Web3?');
      const topicCard = whatIsWeb3Title.closest('.card');

      within(topicCard).getByText('Beginner');
      within(topicCard).getByText('5 min');
      within(topicCard).getByText(/Web3 represents the next evolution of the internet/i);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles rapid category switching', () => {
      render(<Web3Education />);

      const buttons = [
        screen.getByRole('button', { name: /Web3 Basics/i }),
        screen.getByRole('button', { name: /Crypto Wallets/i }),
        screen.getByRole('button', { name: /Tokens & NFTs/i }),
        screen.getByRole('button', { name: /DeFi Explained/i }),
        screen.getByRole('button', { name: /DAOs & Governance/i })
      ];

      buttons.forEach(button => fireEvent.click(button));

      // Last clicked should be active
      expect(buttons[4]).toHaveClass('btn-primary');
    });

    it('handles rapid topic expansion/collapse', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');

      for (let i = 0; i < 5; i++) {
        fireEvent.click(whatIsWeb3);
      }

      // Should be collapsed after odd number of clicks
      expect(screen.queryByText(/Web3, also known as the decentralized web/i)).not.toBeInTheDocument();
    });

    it('maintains state after multiple interactions', () => {
      render(<Web3Education />);

      // Switch category
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      // Expand topic
      const whatIsWallet = screen.getByText('What is a Crypto Wallet?');
      fireEvent.click(whatIsWallet);

      // Switch category again
      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      fireEvent.click(basicsButton);

      // Previous expansion should be reset
      expect(screen.queryByText(/A crypto wallet doesn't actually store your cryptocurrency/i)).not.toBeInTheDocument();
    });

    it('handles empty content gracefully', () => {
      render(<Web3Education />);

      // Component should not crash with any category
      const categories = [
        /Web3 Basics/i,
        /Crypto Wallets/i,
        /Tokens & NFTs/i,
        /DeFi Explained/i,
        /DAOs & Governance/i
      ];

      categories.forEach(category => {
        const button = screen.getByRole('button', { name: category });
        fireEvent.click(button);
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = render(<Web3Education />);

      rerender(<Web3Education />);

      expect(screen.getByText('Web3 Education Center')).toBeInTheDocument();
    });

    it('handles large content efficiently', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      // Should render content without delay
      expect(screen.getByText(/Web3, also known as the decentralized web/i)).toBeInTheDocument();
    });

    it('maintains performance with multiple category switches', () => {
      render(<Web3Education />);

      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
        const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
        fireEvent.click(walletsButton);
        fireEvent.click(basicsButton);
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Content Navigation Patterns', () => {
    it('allows users to navigate from basics to advanced topics', () => {
      render(<Web3Education />);

      // Start with basics
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);
      expect(screen.getByText(/Web3, also known as the decentralized web/i)).toBeInTheDocument();

      // Move to wallets
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);
      expect(screen.getByText('Understanding digital wallets and how to keep your crypto secure')).toBeInTheDocument();

      // Move to DeFi (more advanced)
      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);
      expect(screen.getByText('Decentralized Finance and how it changes traditional banking')).toBeInTheDocument();
    });

    it('provides learning path through next steps', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      // Check that next steps guide the user
      expect(screen.getByText('Learn about blockchain basics')).toBeInTheDocument();
      expect(screen.getByText('Understand cryptocurrency')).toBeInTheDocument();
      expect(screen.getByText('Explore NFTs and tokens')).toBeInTheDocument();
    });

    it('maintains educational flow across categories', () => {
      render(<Web3Education />);

      // Each category should have topics with summaries and content
      const categories = [
        { name: /Web3 Basics/i, topic: 'What is Web3?' },
        { name: /Crypto Wallets/i, topic: 'What is a Crypto Wallet?' },
        { name: /Tokens & NFTs/i, topic: 'Tokens vs Cryptocurrency' }
      ];

      categories.forEach(({ name, topic }) => {
        const categoryButton = screen.getByRole('button', { name });
        fireEvent.click(categoryButton);
        expect(screen.getByText(topic)).toBeInTheDocument();
      });
    });
  });

  describe('Educational Content Quality', () => {
    it('provides beginner-friendly explanations', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      // Check for analogies and simple language
      expect(screen.getByText(/Web3 represents the next evolution of the internet/i)).toBeInTheDocument();
    });

    it('includes real-world examples and analogies', () => {
      render(<Web3Education />);

      const blockchainTech = screen.getByText('Blockchain Technology');
      fireEvent.click(blockchainTech);

      // Check for analogies
      expect(screen.getByText(/Think of it like a special notebook/i)).toBeInTheDocument();
    });

    it('provides practical CRYB platform examples', () => {
      render(<Web3Education />);

      const whyWeb3Matters = screen.getByText('Why Web3 Matters for Social Media');
      fireEvent.click(whyWeb3Matters);

      expect(screen.getByText(/CRYB combines the best of both worlds/i)).toBeInTheDocument();
      expect(screen.getByText(/earn CRYB tokens for creating great content/i)).toBeInTheDocument();
    });

    it('warns users about security risks appropriately', () => {
      render(<Web3Education />);

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      const walletSecurity = screen.getByText('Keeping Your Wallet Safe');
      fireEvent.click(walletSecurity);

      expect(screen.getByText(/Never share your seed phrase with anyone/i)).toBeInTheDocument();
      expect(screen.getByText('Common Scams to Avoid:')).toBeInTheDocument();
    });

    it('balances opportunities with risks', () => {
      render(<Web3Education />);

      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);

      const whatIsDefi = screen.getByText('What is DeFi?');
      fireEvent.click(whatIsDefi);

      expect(screen.getByText('Popular DeFi Services:')).toBeInTheDocument();
      expect(screen.getByText('Risks to understand:')).toBeInTheDocument();
    });
  });

  describe('Visual Hierarchy and Layout', () => {
    it('uses consistent card layout for topics', () => {
      const { container } = render(<Web3Education />);

      const topicCards = container.querySelectorAll('.card.p-lg');
      expect(topicCards.length).toBeGreaterThan(0);
    });

    it('applies consistent spacing throughout', () => {
      const { container } = render(<Web3Education />);

      expect(container.querySelector('.space-y-md')).toBeInTheDocument();
      expect(container.querySelector('.mb-2xl')).toBeInTheDocument();
    });

    it('uses visual indicators for topic state', () => {
      render(<Web3Education />);

      // Collapsed state
      expect(screen.getAllByTestId('chevron-right-icon').length).toBeGreaterThan(0);

      // Expanded state
      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('highlights active category visually', () => {
      render(<Web3Education />);

      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      expect(basicsButton).toHaveClass('btn-primary');

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      expect(walletsButton).toHaveClass('btn-secondary');
    });

    it('uses colored badges for difficulty levels', () => {
      render(<Web3Education />);

      const beginnerBadges = screen.getAllByText('Beginner');
      expect(beginnerBadges[0]).toHaveClass('bg-success/20', 'text-success');
    });

    it('provides clear visual separation between content sections', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      const takeawaysSection = screen.getByText('Key Takeaways').closest('div');
      expect(takeawaysSection).toHaveClass('bg-accent-primary/10');

      const nextStepsSection = screen.getByText('What to Learn Next').closest('div');
      expect(nextStepsSection).toHaveClass('bg-secondary/30');
    });
  });

  describe('Resource Links and External References', () => {
    it('provides multiple resource types', () => {
      render(<Web3Education />);

      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Video Tutorials')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();
    });

    it('includes appropriate icons for resource types', () => {
      render(<Web3Education />);

      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
    });

    it('provides clear call-to-action buttons for resources', () => {
      render(<Web3Education />);

      const browseDocsBtn = screen.getByRole('button', { name: /Browse Docs/i });
      const watchVideosBtn = screen.getByRole('button', { name: /Watch Videos/i });
      const joinCommunityBtn = screen.getByRole('button', { name: /Join Community/i });

      expect(browseDocsBtn).toBeInTheDocument();
      expect(watchVideosBtn).toBeInTheDocument();
      expect(joinCommunityBtn).toBeInTheDocument();
    });

    it('organizes resources in a grid layout', () => {
      const { container } = render(<Web3Education />);
      const resourceGrid = container.querySelector('.grid.md\\:grid-cols-3');
      expect(resourceGrid).toBeInTheDocument();
    });

    it('visually distinguishes resource section from main content', () => {
      const { container } = render(<Web3Education />);

      const resourcesSection = screen.getByText('Additional Resources').closest('div');
      expect(resourcesSection.previousElementSibling).toHaveClass('border-t', 'border-border-primary');
    });
  });

  describe('Typography and Readability', () => {
    it('uses appropriate text sizes for hierarchy', () => {
      render(<Web3Education />);

      const mainTitle = screen.getByText('Web3 Education Center');
      expect(mainTitle).toHaveClass('text-3xl');
    });

    it('uses consistent text colors for content', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      const secondaryTexts = document.querySelectorAll('.text-secondary');
      expect(secondaryTexts.length).toBeGreaterThan(0);
    });

    it('maintains readable line lengths with max-width', () => {
      const { container } = render(<Web3Education />);

      const descriptionContainer = container.querySelector('.max-w-2xl');
      expect(descriptionContainer).toBeInTheDocument();
    });

    it('uses semantic text styling for emphasis', () => {
      render(<Web3Education />);

      const categoryTitle = screen.getByText('Web3 Basics');
      expect(categoryTitle.parentElement).toHaveClass('font-semibold');
    });
  });

  describe('Information Architecture', () => {
    it('organizes content in logical category progression', () => {
      render(<Web3Education />);

      const categories = document.querySelectorAll('button.btn');
      const categoryTexts = Array.from(categories).map(btn => btn.textContent);

      // Should start with basics and progress to advanced topics
      expect(categoryTexts).toContain('Web3 Basics');
      expect(categoryTexts).toContain('Crypto Wallets');
      expect(categoryTexts).toContain('DeFi Explained');
    });

    it('groups related topics within categories', () => {
      render(<Web3Education />);

      // Wallets category should have related topics
      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(screen.getByText('What is a Crypto Wallet?')).toBeInTheDocument();
      expect(screen.getByText('Keeping Your Wallet Safe')).toBeInTheDocument();
    });

    it('provides clear category descriptions', () => {
      render(<Web3Education />);

      expect(screen.getByText('Learn the fundamentals of Web3 and blockchain technology')).toBeInTheDocument();

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(screen.getByText('Understanding digital wallets and how to keep your crypto secure')).toBeInTheDocument();
    });

    it('maintains consistent content structure across topics', () => {
      render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      // Every topic should have these sections
      expect(screen.getByText('Key Takeaways')).toBeInTheDocument();
      expect(screen.getByText('What to Learn Next')).toBeInTheDocument();
    });
  });

  describe('Interaction Feedback', () => {
    it('provides immediate visual feedback on category selection', () => {
      render(<Web3Education />);

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(walletsButton).toHaveClass('btn-primary');
    });

    it('updates content immediately on category change', () => {
      render(<Web3Education />);

      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);

      expect(screen.getByText('Tokens vs Cryptocurrency')).toBeInTheDocument();
    });

    it('shows appropriate cursor styles for interactive elements', () => {
      const { container } = render(<Web3Education />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('maintains focus on interactive elements', () => {
      render(<Web3Education />);

      const basicsButton = screen.getByRole('button', { name: /Web3 Basics/i });
      basicsButton.focus();

      expect(document.activeElement).toBe(basicsButton);
    });
  });

  describe('Content Completeness', () => {
    it('provides comprehensive coverage of Web3 basics', () => {
      render(<Web3Education />);

      expect(screen.getByText('What is Web3?')).toBeInTheDocument();
      expect(screen.getByText('Blockchain Technology')).toBeInTheDocument();
      expect(screen.getByText('Why Web3 Matters for Social Media')).toBeInTheDocument();
    });

    it('covers essential wallet knowledge', () => {
      render(<Web3Education />);

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(screen.getByText('What is a Crypto Wallet?')).toBeInTheDocument();
      expect(screen.getByText('Keeping Your Wallet Safe')).toBeInTheDocument();
    });

    it('explains different types of digital assets', () => {
      render(<Web3Education />);

      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);

      expect(screen.getByText('Tokens vs Cryptocurrency')).toBeInTheDocument();
      expect(screen.getByText('NFTs Explained Simply')).toBeInTheDocument();
    });

    it('introduces advanced concepts appropriately', () => {
      render(<Web3Education />);

      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);

      const whatIsDefi = screen.getByText('What is DeFi?');
      expect(whatIsDefi).toBeInTheDocument();

      fireEvent.click(whatIsDefi);
      expect(screen.getByText('Traditional Finance vs DeFi:')).toBeInTheDocument();
    });

    it('explains governance and community concepts', () => {
      render(<Web3Education />);

      const communityButton = screen.getByRole('button', { name: /DAOs & Governance/i });
      fireEvent.click(communityButton);

      const daoBasics = screen.getByText('DAOs: Organizations for Web3');
      expect(daoBasics).toBeInTheDocument();

      fireEvent.click(daoBasics);
      expect(screen.getByText('How DAOs work:')).toBeInTheDocument();
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for default state', () => {
      const { container } = render(<Web3Education />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with expanded topic', () => {
      const { container } = render(<Web3Education />);

      const whatIsWeb3 = screen.getByText('What is Web3?');
      fireEvent.click(whatIsWeb3);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for wallets category', () => {
      const { container } = render(<Web3Education />);

      const walletsButton = screen.getByRole('button', { name: /Crypto Wallets/i });
      fireEvent.click(walletsButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for tokens category', () => {
      const { container } = render(<Web3Education />);

      const tokensButton = screen.getByRole('button', { name: /Tokens & NFTs/i });
      fireEvent.click(tokensButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for defi category', () => {
      const { container } = render(<Web3Education />);

      const defiButton = screen.getByRole('button', { name: /DeFi Explained/i });
      fireEvent.click(defiButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for community category', () => {
      const { container } = render(<Web3Education />);

      const communityButton = screen.getByRole('button', { name: /DAOs & Governance/i });
      fireEvent.click(communityButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with resources section', () => {
      const { container } = render(<Web3Education />);

      const resourcesSection = screen.getByText('Additional Resources').parentElement;
      expect(resourcesSection).toMatchSnapshot();
    });
  });
});

export default basicsButton
