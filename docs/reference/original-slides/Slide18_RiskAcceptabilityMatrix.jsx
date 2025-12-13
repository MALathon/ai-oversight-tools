import React, { useState, useEffect } from 'react';
import { Notes } from 'spectacle';
import styled, { keyframes, css } from 'styled-components';
import SlideWrapper from './components/SlideWrapper';
import InteractionHint from './components/InteractionHint';
// import useSlideAnimation from './hooks/useSlideAnimation'; // Not needed - loading all at once
import { techCategories } from './techCharacteristics';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(74, 226, 192, 0.4); }
  50% { box-shadow: 0 0 30px rgba(74, 226, 192, 0.6); }
`;

// Main container
const ContentWrapper = styled.div`
  position: absolute;
  top: 60px;
  bottom: 60px;
  left: 80px;
  right: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

// Matrix container
const MatrixContainer = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;
  max-width: 1400px;
  height: 100%;
  align-items: stretch;
`;

// Left side - The matrix grid
const MatrixSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  justify-content: center;
`;

const MatrixGrid = styled.div`
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: 60px repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr) 60px;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 12px;
`;

// Axis labels
const AxisLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  padding: 10px;
  
  &.y-axis {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px 0 0 8px;
  }
  
  &.x-axis {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0 0 8px 8px;
  }
`;

// Card flip animation
const flipAnimation = keyframes`
  from { transform: rotateY(0deg); }
  to { transform: rotateY(180deg); }
`;

// Risk cell container for 3D flip
const RiskCellContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1000px;
  opacity: ${props => props.$visible ? 1 : 0};
  animation: ${props => props.$visible && css`${fadeIn} 0.5s ease-out`};
  animation-delay: ${props => props.$delay || '0s'};
`;

// Risk cell in the matrix - now a flippable card
const RiskCell = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 120px;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform: ${props => props.$flipped ? 'rotateY(180deg)' : 'rotateY(0)'};
  cursor: ${props => props.$canFlip ? 'pointer' : 'default'};
  
  &:hover {
    ${props => props.$canFlip && css`
      .front {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
    `}
  }
`;

const CardFace = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: ${props => {
    const risk = props.$riskLevel;
    if (risk <= 1) return 'linear-gradient(135deg, #4CAF50, #66BB6A)';  // Green for Low
    if (risk <= 2) return 'linear-gradient(135deg, #8BC34A, #9CCC65)';  // Light Green for Low-Medium
    if (risk <= 3) return 'linear-gradient(135deg, #FFC107, #FFD54F)';  // Yellow for Medium
    if (risk <= 4) return 'linear-gradient(135deg, #FF9800, #FFB74D)';  // Orange for Medium-High
    if (risk <= 5) return 'linear-gradient(135deg, #FF5722, #FF7043)';  // Deep Orange for High
    return 'linear-gradient(135deg, #F44336, #EF5350)';  // Red for Critical
  }};
  
  &.front {
    z-index: 2;
    transition: box-shadow 0.3s ease;
  }
  
  &.back {
    transform: rotateY(180deg);
    background: ${props => {
      const risk = props.$riskLevel;
      if (risk <= 1) return 'linear-gradient(135deg, #388E3C, #4CAF50)';  // Darker Green
      if (risk <= 2) return 'linear-gradient(135deg, #689F38, #8BC34A)';  // Darker Light Green
      if (risk <= 3) return 'linear-gradient(135deg, #F57C00, #FFC107)';  // Darker Yellow
      if (risk <= 4) return 'linear-gradient(135deg, #E65100, #FF9800)';  // Darker Orange
      if (risk <= 5) return 'linear-gradient(135deg, #D84315, #FF5722)';  // Darker Deep Orange
      return 'linear-gradient(135deg, #C62828, #F44336)';  // Darker Red
    }};
    overflow-y: auto;
    overflow-x: hidden;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }
  }
`;

const CellContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  align-items: center;
  padding-top: 20px; // Make room for badge
`;

const RiskLabel = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  text-align: center;
  margin-bottom: 4px;
`;

const RiskDetails = styled.div`
  margin-top: 6px;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ControlBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
  gap: 6px;
  
  .number {
    font-size: 16px;
    color: white;
    font-weight: 700;
  }
  
  .label {
    font-size: 11px;
    opacity: 0.9;
  }
`;

const MitigationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
  overflow-y: auto;
`;

const MitigationItem = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: white;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  line-height: 1.3;
  
  .check {
    color: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
    font-weight: bold;
    font-size: 9px;
  }
`;

const BackTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
  text-align: center;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const OversightBadge = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  z-index: 10;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

// Right side - Q3 Technology Risks Panel
const Q3Panel = styled.div`
  width: 380px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border-radius: 12px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateX(${props => props.$visible ? 0 : '20px'});
  transition: all 0.5s ease;
  animation-delay: 0.8s;
  align-self: center;
`;

const PanelTitle = styled.h3`
  font-size: 20px;
  color: #FFC107;
  margin: 0 0 15px 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Q3Badge = styled.span`
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 14px;
  border: 1px solid rgba(255, 193, 7, 0.4);
`;

const PanelSubtitle = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  line-height: 1.4;
`;

const TechDropdown = styled.select`
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  font-size: 13px;
  margin-bottom: 15px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #FFC107;
    background: rgba(255, 255, 255, 0.15);
  }
  
  option {
    background: #003B71;
    color: white;
  }
`;

const RiskScore = styled.div`
  display: flex;
  gap: 2px;
  margin-left: auto;
  padding-left: 8px;
`;

const RiskDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 1px;
  background: ${props => props.$filled ? 
    (props.$level === 4 ? '#FF6B6B' : 
     props.$level === 3 ? '#FF9800' :
     props.$level === 2 ? '#FFC107' : 
     '#9E9E9E') : 'rgba(255, 255, 255, 0.2)'};
`;

const TotalScore = styled.div`
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .score {
    font-size: 16px;
    font-weight: 600;
    color: #FFC107;
  }
`;

const RiskFactorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 15px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 5px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 193, 7, 0.3);
    border-radius: 2px;
  }
`;

const RiskFactor = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 10px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  min-height: 36px;
`;

const RiskCheckbox = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.$present ? '#FFC107' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 3px;
  background: ${props => props.$present ? 'rgba(255, 193, 7, 0.2)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  
  &::after {
    content: ${props => props.$present ? '"✓"' : '""'};
    color: #FFC107;
    font-size: 11px;
    font-weight: bold;
  }
`;

const FactorContent = styled.div`
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0; // Prevent overflow
`;

const FactorTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$present ? '#FFC107' : 'rgba(255, 255, 255, 0.8)'};
  white-space: normal;
  line-height: 1.2;
  flex: 1;
`;

const FactorDesc = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  white-space: normal;
  line-height: 1.2;
  margin-top: 2px;
`;

const ImpactIndicator = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(74, 226, 192, 0.3);
    border-radius: 2px;
  }
`;

const ImpactTitle = styled.div`
  font-size: 13px;
  color: #4AE2C0;
  font-weight: 600;
  margin-bottom: 10px;
`;

const ImpactBar = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ImpactFill = styled.div`
  height: 100%;
  width: ${props => props.$level * 25}%;
  background: ${props => {
    if (props.$level <= 1) return '#4CAF50';
    if (props.$level <= 2) return '#FFC107';
    if (props.$level <= 3) return '#FF9800';
    return '#F44336';
  }};
  transition: all 0.5s ease;
`;


// Interactive hint
// Use imported InteractionHint instead of local definition

const Slide18_RiskAcceptabilityMatrix = () => {
  // Load everything at once - no progressive animation
  const step = 6;
  const isVisible = true;
  const isStepActive = () => true;
  const [selectedCell, setSelectedCell] = useState(null);
  const [flippedCells, setFlippedCells] = useState({}); // Track which cells are flipped
  const [techCategory, setTechCategory] = useState('ml'); // ml, llm, imaging, wearables, apps
  const [expandedRisk, setExpandedRisk] = useState(null); // Track which risk shows mitigations
  const [q3Factors, setQ3Factors] = useState({
    // ML
    dataQuality: false,
    modelComplexity: false,
    drift: false,
    bias: false,
    feature: false,
    // LLM
    hallucination: false,
    privacy: false,
    injection: false,
    consistency: false,
    clinical: false,
    context: false,
    // Imaging
    quality: false,
    detection: false,
    integration: false,
    incidental: false,
    radiation: false,
    // Wearables
    signal: false,
    continuous: false,
    alerts: false,
    battery: false,
    adherence: false,
    emergency: false,
    // Apps
    behavioral: false,
    ehr: false,
    engagement: false,
    crisis: false,
    misinformation: false
  });


  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if we're on slide 18
      const params = new URLSearchParams(window.location.search);
      const slideIndex = params.get('slideIndex');
      
      // Only handle keys when we're on slide 18 (index 17)
      if (slideIndex !== '17') return;
      
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        setSelectedCell(null);
        setFlippedCells({});
        setQ3Factors(Object.keys(q3Factors).reduce((acc, key) => ({
          ...acc,
          [key]: false
        }), {}));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFactor = (factor) => {
    setQ3Factors(prev => ({
      ...prev,
      [factor]: !prev[factor]
    }));
  };

  const toggleCellFlip = (index) => {
    setFlippedCells(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const calculateQ3Impact = () => {
    // Calculate based on total characteristic score
    const totalScore = q3Characteristics.reduce((sum, characteristic) => 
      sum + (q3Factors[characteristic.key] ? characteristic.score : 0), 0
    );
    
    // Convert score to impact level (0-4)
    if (totalScore === 0) return 0;
    if (totalScore <= 3) return 1;
    if (totalScore <= 6) return 2;
    if (totalScore <= 9) return 3;
    return 4;
  };

  const matrixData = [
    // Row 1 - Direct Patient Care (top row in grid)
    { row: 0, col: 1, risk: 4, label: 'Medium-High', oversight: 'Enhanced Review', 
      details: 'Exploratory with direct impact', q1: 'Exploratory', q2: 'Direct Care' },
    { row: 0, col: 2, risk: 5, label: 'High', oversight: 'Full IRB',
      details: 'Translational affecting patients', q1: 'Translational', q2: 'Direct Care' },
    { row: 0, col: 3, risk: 6, label: 'Critical', oversight: 'Full IRB + Monitoring',
      details: 'Clinical deployment to patients', q1: 'Clinical', q2: 'Direct Care' },
    
    // Row 2 - Indirect Impact (middle row)
    { row: 1, col: 1, risk: 2, label: 'Low-Medium', oversight: 'Standard Review',
      details: 'Exploratory with indirect effects', q1: 'Exploratory', q2: 'Indirect' },
    { row: 1, col: 2, risk: 3, label: 'Medium', oversight: 'Enhanced Review',
      details: 'Translational validation phase', q1: 'Translational', q2: 'Indirect' },
    { row: 1, col: 3, risk: 4, label: 'Medium-High', oversight: 'Full IRB',
      details: 'Clinical decision support', q1: 'Clinical', q2: 'Indirect' },
    
    // Row 3 - No Patient Impact (bottom row)
    { row: 2, col: 1, risk: 1, label: 'Low', oversight: 'Minimal',
      details: 'Pure research, no patient involvement', q1: 'Exploratory', q2: 'No Impact' },
    { row: 2, col: 2, risk: 2, label: 'Low-Medium', oversight: 'Standard Review',
      details: 'Algorithm development phase', q1: 'Translational', q2: 'No Impact' },
    { row: 2, col: 3, risk: 3, label: 'Medium', oversight: 'Enhanced Review',
      details: 'Clinical readiness testing', q1: 'Clinical', q2: 'No Impact' },
  ];

  // Now using shared techCategories from techCharacteristics.js
  // This ensures Slide 18 and 19 are synchronized
  /* const techCategories = {
    ml: {
      name: 'ML/Predictive Models',
      characteristics: [
        {
          key: 'autonomous',
          title: 'Operates autonomously',
          desc: 'Makes decisions without human',
          score: 4,
          controls: {
            low: ['Clear operating boundaries', 'Document decision logic'],
            medium: ['Human approval for edge cases', 'Regular audits', 'Override capability'],
            high: ['Kill switch required', 'Real-time monitoring', 'Human takeover protocol', 'Liability insurance']
          }
        },
        {
          key: 'clinical_decisions',
          title: 'Influences clinical decisions',
          desc: 'Outputs affect patient care',
          score: 3,
          controls: {
            low: ['Include disclaimers', 'Research use only'],
            medium: ['Confidence scores required', 'Human review process', 'Second opinion protocol'],
            high: ['Mandatory physician override', 'Decision audit trail', 'Error reporting system', 'Malpractice coverage']
          }
        },
        {
          key: 'continuous_learning',
          title: 'Learns from new data',
          desc: 'Model updates over time',
          score: 3,
          controls: {
            low: ['Version control', 'Change logs'],
            medium: ['Performance drift monitoring', 'Update approval process', 'Testing protocol'],
            high: ['Regulatory re-validation', 'A/B testing protocol', 'Rollback procedures', 'FDA notification']
          }
        },
        {
          key: 'vulnerable_populations',
          title: 'Used on vulnerable groups',
          desc: 'Children, elderly, disabled',
          score: 3,
          controls: {
            low: ['Population documented', 'Inclusion criteria'],
            medium: ['Special consent forms', 'Guardian involvement', 'Extra safeguards'],
            high: ['Ethics board review', 'Advocate required', 'Enhanced monitoring', 'Withdrawal protocol']
          }
        },
        { 
          key: 'patient_data',
          title: 'Uses patient data',
          desc: 'Trained on medical records',
          score: 2,
          controls: {
            low: ['Document data sources', 'Data dictionary'],
            medium: ['Privacy impact assessment', 'De-identification protocol', 'Access logs'],
            high: ['Full HIPAA compliance', 'Consent workflows', 'Data retention policies', 'Audit trails']
          }
        },
        {
          key: 'black_box',
          title: 'Black box model',
          desc: 'Cannot explain decisions',
          score: 2,
          controls: {
            low: ['Document model type', 'Performance metrics'],
            medium: ['Feature importance analysis', 'Sample explanations', 'Validation studies'],
            high: ['Full explainability suite', 'Decision trace documentation', 'Expert review panel']
          }
        },
        {
          key: 'rare_events',
          title: 'Predicts rare events',
          desc: 'Low prevalence conditions',
          score: 2,
          controls: {
            low: ['Prevalence documented', 'Baseline rates'],
            medium: ['Sensitivity/specificity analysis', 'Calibration testing', 'False positive protocol'],
            high: ['Clinical correlation required', 'Specialist review', 'Confirmation testing']
          }
        },
        {
          key: 'multi_site',
          title: 'Deployed across sites',
          desc: 'Multiple institutions',
          score: 1,
          controls: {
            low: ['Site list maintained', 'Contact points'],
            medium: ['Site-specific validation', 'Performance monitoring', 'Standardization protocol'],
            high: ['Federated learning', 'Site agreements', 'Central monitoring', 'Harmonization studies']
          }
        }
      ]
    },
    llm: {
      name: 'Large Language Models',
      characteristics: [
        {
          key: 'medical_knowledge',
          title: 'Provides medical advice',
          desc: 'Answers health questions',
          score: 4,
          controls: {
            low: ['General health only', 'Educational disclaimer', 'Not medical advice'],
            medium: ['Disclaimer required', 'Encourage provider consultation', 'Scope boundaries', 'Reference sources'],
            high: ['Licensed provider review', 'FDA compliance check', 'Clinical validation', 'Liability coverage', 'Expert oversight']
          }
        },
        {
          key: 'conversational',
          title: 'Patient-facing chat',
          desc: 'Direct patient interaction',
          score: 4,
          controls: {
            low: ['Clear bot identification', 'Limited scope', 'Hours of operation'],
            medium: ['Escalation to human', 'Scope limitations', 'Conversation monitoring', 'Feedback mechanism'],
            high: ['24/7 human backup', 'Crisis detection', 'Conversation logs', 'Real-time supervision', 'Emergency protocols']
          }
        },
        {
          key: 'hallucination',
          title: 'May generate false info',
          desc: 'Can create plausible lies',
          score: 4,
          controls: {
            low: ['Accuracy disclaimers', 'User education', 'Confidence indicators'],
            medium: ['Fact-checking required', 'Source verification', 'Output review', 'Uncertainty flagging'],
            high: ['Expert validation', 'Ground truth checking', 'Retrieval augmentation', 'Citation mandatory', 'Error tracking']
          }
        },
        {
          key: 'external_api',
          title: 'Uses external API',
          desc: 'Sends data to cloud',
          score: 3,
          controls: {
            low: ['API documentation', 'Terms of service', 'Data types logged'],
            medium: ['Data processing agreement', 'Encryption in transit', 'API monitoring', 'Rate limiting'],
            high: ['BAA required', 'Local deployment only', 'Zero data retention', 'Audit logs', 'HIPAA compliant']
          }
        },
        {
          key: 'generates_text',
          title: 'Generates medical text',
          desc: 'Creates clinical narratives',
          score: 3,
          controls: {
            low: ['Label as AI-generated', 'Draft only', 'Template-based'],
            medium: ['Fact-checking protocol', 'Citation requirements', 'Review workflow', 'Version tracking'],
            high: ['Medical expert review', 'Liability disclaimers', 'Output validation', 'Regulatory approval', 'Quality assurance']
          }
        },
        {
          key: 'prompt_injection',
          title: 'Vulnerable to prompts',
          desc: 'Can be manipulated',
          score: 3,
          controls: {
            low: ['Input validation', 'Basic filtering', 'User authentication'],
            medium: ['Prompt sanitization', 'Output filtering', 'Anomaly detection', 'Rate limiting'],
            high: ['Security testing', 'Jailbreak protection', 'Content filtering', 'Monitoring system', 'Incident response']
          }
        },
        {
          key: 'context_window',
          title: 'Processes long contexts',
          desc: 'Full medical records',
          score: 2,
          controls: {
            low: ['Context size limits', 'Summary only', 'Key fields only'],
            medium: ['PHI scrubbing', 'Chunking strategy', 'Relevance filtering', 'Data minimization'],
            high: ['Selective context loading', 'Memory management', 'Privacy preserving', 'Audit trail', 'Access controls']
          }
        },
        {
          key: 'training_data',
          title: 'Unknown training data',
          desc: 'May contain biases',
          score: 2,
          controls: {
            low: ['Model card review', 'Bias disclaimer', 'Limitations documented'],
            medium: ['Bias testing', 'Demographic validation', 'Performance monitoring', 'Fairness metrics'],
            high: ['Comprehensive bias audit', 'Retraining protocol', 'Equity review board', 'Continuous monitoring']
          }
        },
        {
          key: 'cost_per_use',
          title: 'Variable costs',
          desc: 'Token-based pricing',
          score: 1,
          controls: {
            low: ['Budget limits', 'Usage tracking', 'Cost estimates'],
            medium: ['Usage quotas', 'Department billing', 'Cost optimization', 'Alternative models'],
            high: ['ROI analysis', 'Budget approval', 'Cost-benefit study', 'Procurement review']
          }
        }
      ]
    },
    imaging: {
      name: 'Medical Imaging AI',
      characteristics: [
        {
          key: 'diagnostic',
          title: 'Makes diagnoses',
          desc: 'Identifies pathology',
          score: 4,
          controls: {
            low: ['Research use only', 'Not for clinical use', 'Performance metrics'],
            medium: ['Radiologist required', 'Second reader protocol', 'Confidence thresholds', 'QA process'],
            high: ['FDA 510(k) clearance', 'Clinical validation', 'Liability insurance', 'Expert panel review', 'Post-market surveillance']
          }
        },
        {
          key: 'triage',
          title: 'Triages cases',
          desc: 'Prioritizes worklist',
          score: 3,
          controls: {
            low: ['Priority guidelines', 'Override option', 'Manual review'],
            medium: ['Performance monitoring', 'Fairness testing', 'Workflow integration', 'Escalation protocol'],
            high: ['Clinical validation', 'Bias assessment', 'Patient safety protocol', 'Continuous monitoring', 'Equity analysis']
          }
        },
        {
          key: 'screening',
          title: 'Population screening',
          desc: 'Processes many patients',
          score: 3,
          controls: {
            low: ['Quality sampling', 'Batch review', 'Statistics tracking'],
            medium: ['Batch QA process', 'False positive protocol', 'Recall procedures', 'Performance tracking'],
            high: ['Public health approval', 'Equity analysis', 'Follow-up protocols', 'Registry reporting', 'Outcome tracking']
          }
        },
        {
          key: 'real_time',
          title: 'Real-time analysis',
          desc: 'During procedures',
          score: 3,
          controls: {
            low: ['Latency specs', 'Performance testing', 'Backup plan'],
            medium: ['Fallback protocol', 'Performance monitoring', 'Alert thresholds', 'Quality checks'],
            high: ['Redundant systems', 'Expert backup', 'Failure protocols', 'Real-time QA', 'Safety mechanisms']
          }
        },
        {
          key: 'incidental',
          title: 'Finds incidentals',
          desc: 'Unexpected findings',
          score: 3,
          controls: {
            low: ['Finding categories', 'Reporting guidelines', 'Documentation'],
            medium: ['Management protocol', 'Referral pathways', 'Patient communication', 'Follow-up tracking'],
            high: ['Ethics review', 'Consent process', 'Specialist referral', 'Psychological support', 'Legal framework']
          }
        },
        {
          key: 'quantitative',
          title: 'Quantitative measures',
          desc: 'Numeric biomarkers',
          score: 2,
          controls: {
            low: ['Units documented', 'Normal ranges', 'Precision stated'],
            medium: ['Calibration protocol', 'Reference standards', 'Reproducibility testing', 'Error bars'],
            high: ['Metrological validation', 'Uncertainty analysis', 'Cross-platform testing', 'Clinical correlation', 'FDA submission']
          }
        },
        {
          key: 'modality_fusion',
          title: 'Multi-modality fusion',
          desc: 'Combines imaging types',
          score: 2,
          controls: {
            low: ['Registration accuracy', 'Modality list', 'Fusion method'],
            medium: ['Cross-validation', 'Artifact detection', 'Quality metrics', 'Consistency checks'],
            high: ['Modality validation', 'Integration testing', 'Clinical studies', 'Regulatory approval']
          }
        },
        {
          key: 'reconstruction',
          title: 'Image reconstruction',
          desc: 'Creates new views',
          score: 2,
          controls: {
            low: ['Method documented', 'Validation data', 'Known limitations'],
            medium: ['Phantom testing', 'Ground truth comparison', 'Artifact assessment', 'Quality metrics'],
            high: ['Clinical validation', 'Regulatory submission', 'Expert review', 'Longitudinal studies']
          }
        },
        {
          key: 'dose_optimization',
          title: 'Affects radiation dose',
          desc: 'Changes exposure levels',
          score: 2,
          controls: {
            low: ['Dose documentation', 'ALARA principle', 'Protocol defined'],
            medium: ['Dose monitoring', 'Quality vs dose trade-off', 'Patient size adjustment', 'DRL compliance'],
            high: ['Physics review', 'Dose optimization study', 'Patient consent', 'Regulatory approval', 'Outcome tracking']
          }
        }
      ]
    },
    wearables: {
      name: 'Wearables/IoT',
      characteristics: [
        {
          key: 'emergency_detection',
          title: 'Detects emergencies',
          desc: 'Falls, arrhythmias, etc.',
          score: 4,
          controls: {
            low: ['Emergency contacts', 'User training', 'False positive info'],
            medium: ['Validation studies', '911 integration', 'Caregiver alerts', 'Sensitivity settings'],
            high: ['Clinical validation', 'EMS protocols', 'Liability coverage', '24/7 support', 'Chain of custody']
          }
        },
        {
          key: 'continuous',
          title: 'Continuous monitoring',
          desc: '24/7 data collection',
          score: 3,
          controls: {
            low: ['Privacy notice', 'Data types listed', 'Opt-out option'],
            medium: ['Data minimization', 'User controls', 'Pause capability', 'Download rights'],
            high: ['Granular consent', 'Right to delete', 'Retention limits', 'Purpose limitation', 'Data portability']
          }
        },
        {
          key: 'alerts',
          title: 'Sends health alerts',
          desc: 'Notifies conditions',
          score: 3,
          controls: {
            low: ['Alert types listed', 'Disable option', 'User settings'],
            medium: ['Customizable thresholds', 'Snooze function', 'Alert fatigue monitoring', 'Escalation rules'],
            high: ['Clinical validation', 'Escalation pathways', 'False alarm tracking', 'Provider integration', 'Alert optimization']
          }
        },
        {
          key: 'vital_signs',
          title: 'Measures vital signs',
          desc: 'HR, BP, SpO2, etc.',
          score: 3,
          controls: {
            low: ['Accuracy specs', 'Measurement conditions', 'Limitations stated'],
            medium: ['Clinical validation', 'Calibration protocol', 'Error handling', 'Trending analysis'],
            high: ['FDA clearance', 'Medical grade accuracy', 'Clinical studies', 'Reference standard comparison', 'Continuous QA']
          }
        },
        {
          key: 'remote',
          title: 'Remote monitoring',
          desc: 'Clinician receives data',
          score: 2,
          controls: {
            low: ['Transmission schedule', 'Data types', 'Provider access'],
            medium: ['Clinician dashboard', 'Review protocols', 'Alert criteria', 'Integration specs'],
            high: ['24/7 monitoring', 'Response SLAs', 'Clinical workflows', 'Care coordination', 'Outcome tracking']
          }
        },
        {
          key: 'consumer_grade',
          title: 'Consumer device',
          desc: 'Not medical grade',
          score: 2,
          controls: {
            low: ['Accuracy disclaimers', 'Not for diagnosis', 'Wellness only'],
            medium: ['Validation studies', 'Limitations documented', 'Provider guidance', 'Correlation data'],
            high: ['Clinical correlation', 'Medical supervision', 'Adjunct use only', 'Clear boundaries', 'Patient education']
          }
        },
        {
          key: 'battery_dependent',
          title: 'Battery powered',
          desc: 'Needs charging',
          score: 2,
          controls: {
            low: ['Battery indicators', 'Low battery alerts', 'Charging reminders'],
            medium: ['Battery life specs', 'Backup protocols', 'Data preservation', 'Offline mode'],
            high: ['Redundant devices', 'Failover procedures', 'Critical alert backup', 'Power management', 'Continuity planning']
          }
        },
        {
          key: 'skin_contact',
          title: 'Skin contact required',
          desc: 'Adhesives, sensors',
          score: 1,
          controls: {
            low: ['Material safety', 'Allergy warnings', 'Rotation guidance'],
            medium: ['Skin assessment', 'Reaction protocol', 'Alternative options', 'Comfort optimization'],
            high: ['Dermatology consult', 'Reaction monitoring', 'Medical adhesives', 'Skin integrity protocol']
          }
        },
        {
          key: 'behavioral',
          title: 'Tracks behaviors',
          desc: 'Activity, sleep, etc.',
          score: 1,
          controls: {
            low: ['User education', 'Privacy settings', 'Data categories'],
            medium: ['Behavioral opt-in', 'Aggregation only', 'Pattern analysis', 'Insights control'],
            high: ['IRB review', 'Psychological support', 'Behavioral science input', 'Ethical framework']
          }
        }
      ]
    },
    apps: {
      name: 'Digital Therapeutics',
      characteristics: [
        {
          key: 'mental_health',
          title: 'Mental health focus',
          desc: 'Depression, anxiety, etc.',
          score: 4,
          controls: {
            low: ['Crisis resources', 'Helpline numbers', 'When to seek help'],
            medium: ['Safety assessments', 'Escalation protocols', 'Risk screening', 'Provider referral'],
            high: ['24/7 crisis support', 'Provider alerts', 'Emergency intervention', 'Suicide prevention', 'Real-time monitoring']
          }
        },
        {
          key: 'substance_use',
          title: 'Substance use disorder',
          desc: 'Addiction treatment',
          score: 4,
          controls: {
            low: ['Recovery resources', 'Support groups', 'Educational content'],
            medium: ['Relapse prevention', 'Trigger monitoring', 'Sponsor connection', 'Progress tracking'],
            high: ['Medical supervision', 'MAT integration', 'Emergency protocols', 'Withdrawal management', 'Clinical coordination']
          }
        },
        {
          key: 'therapeutic',
          title: 'Delivers therapy',
          desc: 'CBT, DBT, etc.',
          score: 3,
          controls: {
            low: ['Evidence-based', 'Self-help format', 'Progress tracking'],
            medium: ['Licensed content', 'Therapist review', 'Homework assignments', 'Skill building'],
            high: ['Clinical trials', 'FDA clearance', 'Outcomes monitoring', 'Therapist supervision', 'Efficacy studies']
          }
        },
        {
          key: 'pediatric',
          title: 'For children/teens',
          desc: 'Under 18 users',
          score: 3,
          controls: {
            low: ['Age verification', 'Age-appropriate', 'Parent resources'],
            medium: ['Parental consent', 'COPPA compliance', 'Parent dashboard', 'School friendly'],
            high: ['Pediatric expertise', 'Guardian access', 'School integration', 'Mandatory reporting', 'Child psychologist review']
          }
        },
        {
          key: 'medication_mgmt',
          title: 'Medication management',
          desc: 'Dosing, reminders',
          score: 3,
          controls: {
            low: ['Reminder only', 'Med list', 'Basic tracking'],
            medium: ['Interaction checking', 'Adherence monitoring', 'Refill alerts', 'Side effect tracking'],
            high: ['Prescriber integration', 'Pharmacy connection', 'Clinical protocols', 'Dose adjustment', 'Safety monitoring']
          }
        },
        {
          key: 'prescription',
          title: 'Prescription required',
          desc: 'Provider prescribes',
          score: 2,
          controls: {
            low: ['Rx verification', 'Provider lookup', 'Eligibility check'],
            medium: ['Provider portal', 'Usage reports', 'Adherence data', 'Outcome metrics'],
            high: ['REMS compliance', 'Controlled access', 'Prescriber training', 'Registry reporting', 'Pharmacovigilance']
          }
        },
        {
          key: 'chronic',
          title: 'Chronic disease mgmt',
          desc: 'Diabetes, COPD, etc.',
          score: 2,
          controls: {
            low: ['Education modules', 'Self-monitoring', 'Goal setting'],
            medium: ['Care plan integration', 'Provider updates', 'Trend analysis', 'Alert thresholds'],
            high: ['Clinical protocols', 'Lab integration', 'Multi-disciplinary team', 'Outcome prediction', 'Population health']
          }
        },
        {
          key: 'coaching',
          title: 'Health coaching',
          desc: 'Behavior change',
          score: 2,
          controls: {
            low: ['Goal tracking', 'Motivational content', 'Progress badges'],
            medium: ['Personalization', 'Coach certification', 'Evidence-based', 'Engagement tracking'],
            high: ['Clinical supervision', 'Outcome validation', 'Behavior science', 'RCT evidence', 'Long-term follow-up']
          }
        },
        {
          key: 'gamification',
          title: 'Uses gamification',
          desc: 'Points, rewards, etc.',
          score: 1,
          controls: {
            low: ['Reward structure', 'Achievement system', 'User control'],
            medium: ['Addiction prevention', 'Age appropriate', 'Clinical alignment', 'Ethical design'],
            high: ['Behavioral assessment', 'Psychology review', 'Outcome correlation', 'Harm prevention']
          }
        }
      ]
    }
  }; */
  
  // Sort characteristics by score (highest priority first)
  const q3Characteristics = techCategories[techCategory].characteristics.sort((a, b) => b.score - a.score);
  
  const getActiveMitigations = (cellRisk = null) => {
    const controls = [];
    
    // Only return controls if Q3 characteristics are selected
    if (calculateQ3Impact() === 0) return controls;
    
    // Determine which controls are needed based on risk level
    q3Characteristics.forEach(characteristic => {
      if (q3Factors[characteristic.key]) {
        // Select controls based on the cell's risk level
        let riskCategory;
        if (cellRisk <= 2) {
          riskCategory = 'low';
        } else if (cellRisk <= 4) {
          riskCategory = 'medium';
        } else {
          riskCategory = 'high';
        }
        
        if (characteristic.controls[riskCategory]) {
          controls.push(...characteristic.controls[riskCategory]);
        }
      }
    });
    
    // Remove duplicates
    return [...new Set(controls)];
  };
  
  const shouldShowMitigations = (cellRisk) => {
    // Only show mitigations for cells with risk > 2 (not for low risk discovery) AND when Q3 risks are selected
    return cellRisk > 2 && calculateQ3Impact() > 0;
  };

  return (
    <SlideWrapper 
      slideNumber={18}
      slideTitle="Risk Control Prioritization Matrix"
      totalSlides={20}
      navigationHint="ISO 14971-based framework • Select risks to see controls • ← → Navigate"
    >
      <ContentWrapper>
        <MatrixContainer>
          <MatrixSection>
            {/* Y-axis title label - positioned fully outside */}
            <div style={{
              position: 'absolute',
              left: '-120px',
              top: '40%',
              transform: 'translateY(-50%) rotate(-90deg)',
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              whiteSpace: 'nowrap',
              transformOrigin: 'center',
              width: '200px',
              textAlign: 'center'
            }}>
              Q2: Patient Impact →
            </div>
            <MatrixGrid>
              {/* Y-axis labels - showing patient impact levels */}
              <div style={{
                gridRow: '1',
                gridColumn: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px 0 0 0',
                padding: '8px',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed'
              }}>
                Direct Care
              </div>
              <div style={{
                gridRow: '2',
                gridColumn: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '8px',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed'
              }}>
                Indirect
              </div>
              <div style={{
                gridRow: '3',
                gridColumn: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0 0 0 8px',
                padding: '8px',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed'
              }}>
                No Impact
              </div>
              
              {/* Matrix cells */}
              {matrixData.map((cell, index) => {
                const mitigations = getActiveMitigations(cell.risk);
                const hasControls = shouldShowMitigations(cell.risk) && mitigations.length > 0;
                
                return (
                  <RiskCellContainer
                    key={index}
                    $visible={true}
                    $delay={`${index * 0.1}s`}
                    style={{
                      gridRow: cell.row + 1,
                      gridColumn: cell.col + 1
                    }}
                  >
                    <RiskCell
                      $flipped={flippedCells[index]}
                      $canFlip={hasControls}
                      onClick={() => hasControls && toggleCellFlip(index)}
                    >
                      {/* Front of card */}
                      <CardFace 
                        className="front"
                        $riskLevel={cell.risk}
                        $q3Active={calculateQ3Impact() > 0}
                        $q3Impact={calculateQ3Impact()}
                      >
                        <OversightBadge>{cell.oversight}</OversightBadge>
                        <CellContent>
                          <RiskLabel>{cell.label} Risk</RiskLabel>
                          <RiskDetails>
                            <div style={{
                              fontSize: '11px', 
                              color: 'white', 
                              lineHeight: '1.3',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                              fontWeight: '500'
                            }}>
                              {cell.details}
                            </div>
                            {hasControls && (
                              <ControlBadge>
                                <span className="number">{mitigations.length}</span>
                                <span className="label">Controls</span>
                              </ControlBadge>
                            )}
                            {hasControls && (
                              <div style={{
                                fontSize: '10px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginTop: '6px',
                                fontStyle: 'italic'
                              }}>
                                Click to flip →
                              </div>
                            )}
                          </RiskDetails>
                        </CellContent>
                      </CardFace>
                      
                      {/* Back of card */}
                      <CardFace 
                        className="back"
                        $riskLevel={cell.risk}
                        $q3Active={calculateQ3Impact() > 0}
                        $q3Impact={calculateQ3Impact()}
                      >
                        <BackTitle>Potential Risk Controls</BackTitle>
                        <MitigationsList>
                          {mitigations.map((mitigation, idx) => (
                            <MitigationItem key={idx}>
                              <span className="check">✓</span>
                              <span>{mitigation}</span>
                            </MitigationItem>
                          ))}
                        </MitigationsList>
                        {calculateQ3Impact() >= 3 && (
                          <div style={{
                            fontSize: '10px',
                            color: '#FFB74D',
                            fontWeight: '600',
                            marginTop: '12px',
                            textAlign: 'center',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '4px 8px',
                            borderRadius: '12px'
                          }}>
                            ⚠️ IRB deep dive expected
                          </div>
                        )}
                      </CardFace>
                    </RiskCell>
                  </RiskCellContainer>
                );
              })}
              
              {/* X-axis labels */}
              <div style={{gridRow: '4', gridColumn: '1'}}></div>
              <AxisLabel className="x-axis" style={{gridRow: '4', gridColumn: '2'}}>
                Exploratory
              </AxisLabel>
              <AxisLabel className="x-axis" style={{gridRow: '4', gridColumn: '3'}}>
                Translational
              </AxisLabel>
              <AxisLabel className="x-axis" style={{gridRow: '4', gridColumn: '4'}}>
                Clinical
              </AxisLabel>
            </MatrixGrid>
            
            {/* X-axis title */}
            <div style={{textAlign: 'center', marginTop: '15px', fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600'}}>
              Q1: Clinical Intent →
            </div>
          </MatrixSection>

          <Q3Panel $visible={true} $delay="0.4s">
            <PanelTitle>
              <Q3Badge>Q3</Q3Badge>
              Technology Characteristics
            </PanelTitle>
            
            <PanelSubtitle>
              Select technology features to determine appropriate controls
            </PanelSubtitle>
            
            <TechDropdown value={techCategory} onChange={(e) => {
              setTechCategory(e.target.value);
              // Reset all factors when changing category
              setQ3Factors(Object.keys(q3Factors).reduce((acc, key) => ({
                ...acc,
                [key]: false
              }), {}));
            }}>
              {Object.entries(techCategories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.name}</option>
              ))}
            </TechDropdown>
            
            <RiskFactorList>
              {q3Characteristics.map((characteristic) => (
                <RiskFactor key={characteristic.key}>
                  <RiskCheckbox 
                    $present={q3Factors[characteristic.key]}
                    onClick={() => toggleFactor(characteristic.key)}
                  />
                  <FactorContent onClick={() => toggleFactor(characteristic.key)}>
                    <div style={{display: 'flex', width: '100%', alignItems: 'center', gap: '8px'}}>
                      <div style={{flex: 1}}>
                        <FactorTitle $present={q3Factors[characteristic.key]}>
                          {characteristic.name}
                        </FactorTitle>
                        <FactorDesc>{characteristic.desc}</FactorDesc>
                      </div>
                      <RiskScore>
                        {[...Array(4)].map((_, i) => (
                          <RiskDot key={i} $filled={i < characteristic.score} $level={characteristic.score} />
                        ))}
                      </RiskScore>
                    </div>
                  </FactorContent>
                </RiskFactor>
              ))}
            </RiskFactorList>
            
            <TotalScore>
              <div className="label">Complexity Score</div>
              <div className="score">
                {q3Characteristics.reduce((sum, characteristic) => 
                  sum + (q3Factors[characteristic.key] ? characteristic.score : 0), 0)}
                 / {q3Characteristics.reduce((sum, c) => sum + c.score, 0)}
              </div>
            </TotalScore>

          </Q3Panel>
        </MatrixContainer>
      </ContentWrapper>
      
      {/* ISO 14971 Reference - bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '70px',
        right: '40px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.5)',
        fontStyle: 'italic'
      }}>
        Based on ISO 14971 Risk Management
      </div>

      <InteractionHint>
        <kbd>R</kbd> Reset <span className="separator">•</span> Click cells to flip <span className="separator">•</span> Click factors to toggle <span className="separator">•</span> <kbd>←</kbd> <kbd>→</kbd> Navigate
      </InteractionHint>

      <Notes>
        Risk-Based Oversight Framework
        
        This matrix shows how Q1 (Clinical Intent) and Q2 (Patient Impact) determine 
        the base risk level and oversight requirements.
        
        Q3 (Technology Risks) adds another dimension - it doesn't change the base 
        oversight level but informs what specific mitigations are needed:
        - Data quality controls
        - Explainability requirements
        - Human oversight mechanisms
        - Reversibility procedures
        
        The interactive panel on the right shows how technology risks accumulate
        and increase the overall risk profile, requiring additional safeguards.
      </Notes>
    </SlideWrapper>
  );
};

export default Slide18_RiskAcceptabilityMatrix;