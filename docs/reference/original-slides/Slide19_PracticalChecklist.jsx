import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Notes } from 'spectacle';
import SlideWrapper from './components/SlideWrapper';
import InteractionHint from './components/InteractionHint';
import { techCategories, getRecommendedControls } from './techCharacteristics';

// Robust quantitative scoring system with comprehensive filtering

const ContentContainer = styled.div`
  width: 100%;
  margin: -30px 0 0;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
`;

const Subtitle = styled.h2`
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin: 20px 0 15px 0;  // Increased top margin to prevent overlap
  padding: 0 20px;
  
  span {
    color: #4AE2C0;
    font-weight: 600;
  }
`;

const MainContainer = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  height: calc(100vh - 300px);  // Adjusted for better spacing
  max-height: 500px;
  min-width: 0;
`;

const Panel = styled.div`
  flex: 1 1 33.333%;
  min-width: 0;
  width: 33.333%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  
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

const PanelTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StepBadge = styled.span`
  background: ${props => props.$color};
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
`;

// Question styles
const QuestionGroup = styled.div`
  margin-bottom: 15px;
`;

const QuestionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$color || 'rgba(255, 255, 255, 0.9)'};
  margin-bottom: 6px;
`;

const Select = styled.select`
  width: 100%;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  font-size: 11px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4AE2C0;
  }
  
  option {
    background: #1a1a1a;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  
  input[type="radio"] {
    cursor: pointer;
  }
`;

const YesNoQuestion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
`;

const YesNoText = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
`;

const YesNoButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const YesNoButton = styled.button`
  padding: 3px 10px;
  font-size: 10px;
  border: 1px solid ${props => props.$active ? props.$yes ? '#4AE2C0' : '#FF6B6B' : 'rgba(255, 255, 255, 0.2)'};
  background: ${props => props.$active ? props.$yes ? 'rgba(74, 226, 192, 0.2)' : 'rgba(255, 107, 107, 0.2)' : 'transparent'};
  color: ${props => props.$active ? props.$yes ? '#4AE2C0' : '#FF6B6B' : 'rgba(255, 255, 255, 0.6)'};
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => !props.$active && 'rgba(255, 255, 255, 0.05)'};
  }
`;

// Characteristic selection styles with badges on border
const CharacteristicWrapper = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const CategoryBadge = styled.div`
  position: absolute;
  top: -8px;
  left: 12px;
  padding: 2px 10px;
  font-size: 9px;
  font-weight: 700;
  border-radius: 10px;
  text-transform: uppercase;
  white-space: nowrap;
  z-index: 2;
  background: ${props => 
    props.$category === 'critical' ? '#FF6B6B' :
    props.$category === 'important' ? '#FFD93D' :
    props.$category === 'suggested' ? '#4AE2C0' :
    'rgba(255, 255, 255, 0.3)'};
  color: ${props => 
    props.$category === 'critical' || props.$category === 'important' || props.$category === 'suggested' ? '#1a1a1a' : 'white'};
  border: 1px solid ${props => 
    props.$category === 'critical' ? '#FF6B6B' :
    props.$category === 'important' ? '#FFD93D' :
    props.$category === 'suggested' ? '#4AE2C0' :
    'rgba(255, 255, 255, 0.3)'};
`;

const CharacteristicItem = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${props => 
    props.$category === 'critical' ? 'rgba(255, 107, 107, 0.3)' :
    props.$category === 'important' ? 'rgba(255, 217, 61, 0.3)' :
    props.$category === 'suggested' ? 'rgba(74, 226, 192, 0.3)' :
    'rgba(255, 255, 255, 0.15)'};
  border-radius: 8px;
  padding: 14px 10px 10px;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
  
  ${props => props.$selected && `
    background: rgba(74, 226, 192, 0.08);
    border-color: rgba(74, 226, 192, 0.4);
  `}
`;

const CharacteristicHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const CharacteristicCheckbox = styled.input`
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
`;

const CharacteristicLabel = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$disabled ? 'rgba(255, 255, 255, 0.4)' : 'white'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  flex: 1;
`;

const CharacteristicDescription = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 22px;
  line-height: 1.3;
`;

// Control status styles
const ControlStatusDropdown = styled.select`
  width: 100%;
  padding: 4px 8px;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  font-size: 10px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4AE2C0;
  }
  
  option {
    background: #1a1a1a;
  }
`;

const ControlSelectionContainer = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px solid rgba(74, 226, 192, 0.3);
  width: 100%;
  box-sizing: border-box;
`;

const ControlCheckbox = styled.label`
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  
  input {
    margin-right: 6px;
    margin-top: 2px;
    cursor: pointer;
  }
  
  &:hover {
    color: white;
  }
`;

const CustomControlInput = styled.input`
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
  margin-top: 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  font-size: 10px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:focus {
    outline: none;
    border-color: #4AE2C0;
  }
`;

// Protocol requirements styles
const RequirementGroup = styled.div`
  margin-bottom: 15px;
`;

const DisclaimerWatermark = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  pointer-events: none;
  z-index: 9999;
  opacity: 1;
  white-space: nowrap;
  letter-spacing: 8px;
  text-align: center;
  line-height: 1.2;
  
  span {
    display: block;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 2px;
    margin-top: 10px;
  }
`;

const RequirementHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const RequirementTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: white;
`;

const RequirementCount = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(74, 226, 192, 0.2);
  color: #4AE2C0;
  border-radius: 3px;
`;

const RequirementList = styled.div`
  margin-top: 8px;
  padding-left: 12px;
  display: ${props => props.$collapsed ? 'none' : 'block'};
`;

const RequirementItem = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  padding-left: 12px;
  position: relative;
  
  &:before {
    content: '•';
    position: absolute;
    left: 0;
    color: rgba(74, 226, 192, 0.5);
  }
`;

// Institution Profile Toggle Styles
const ProfileToggleContainer = styled.div`
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 10px;  // Added margin to prevent overlap
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
`;

const ProfileLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  margin-right: 20px;
`;

const ProfileToggle = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 3px;
  position: relative;
`;

const ProfileOption = styled.button`
  padding: 8px 18px;
  font-size: 11px;
  border: none;
  background: ${props => props.$active ? 
    props.$profile === 'conservative' ? 'rgba(255, 107, 107, 0.3)' :
    props.$profile === 'standard' ? 'rgba(74, 226, 192, 0.3)' :
    'rgba(30, 136, 229, 0.3)' : 'transparent'};
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-weight: ${props => props.$active ? '600' : '400'};
  
  &:hover {
    background: ${props => !props.$active && 'rgba(255, 255, 255, 0.05)'};
  }
`;

const ProfileDescription = styled.div`
  font-size: 14px;
  color: ${props => 
    props.$profile === 'conservative' ? 'rgba(255, 107, 107, 1)' :
    props.$profile === 'standard' ? 'rgba(74, 226, 192, 1)' :
    'rgba(30, 136, 229, 1)'};
  margin-left: auto;
  padding-left: 20px;
  font-weight: 600;
`;

const Slide19PracticalChecklist = () => {
  const [techType, setTechType] = useState('ml');
  const [q1Answer, setQ1Answer] = useState('');
  const [q2Answers, setQ2Answers] = useState({});
  const [selectedCharacteristics, setSelectedCharacteristics] = useState({});
  const [characteristicStatus, setCharacteristicStatus] = useState({});
  const [selectedControls, setSelectedControls] = useState({});
  const [customControls, setCustomControls] = useState({}); // Now stores arrays of custom controls
  const [evaluatingControls, setEvaluatingControls] = useState({}); // Controls being evaluated in study
  const [customEvaluatingControls, setCustomEvaluatingControls] = useState({}); // Custom controls to evaluate
  const [noRiskJustifications, setNoRiskJustifications] = useState({});
  const [oversightLevel, setOversightLevel] = useState('minimal');
  const [institutionProfile, setInstitutionProfile] = useState('standard');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedCharacteristics, setCollapsedCharacteristics] = useState({});
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Add keyboard handler with control key combinations to avoid interference with typing
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if we're on slide 19
      const params = new URLSearchParams(window.location.search);
      const slideIndex = params.get('slideIndex');
      
      // Only handle keys when we're on slide 19 (index 18)
      if (slideIndex !== '18') return;
      
      // Don't trigger if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        return;
      }
      
      // Handle Ctrl+D or Cmd+D for disclaimer toggle
      if ((event.ctrlKey || event.metaKey) && (event.key === 'd' || event.key === 'D')) {
        event.preventDefault();
        setShowDisclaimer(prev => !prev);
      }
      
      // Handle Ctrl+R or Cmd+R for reset
      if ((event.ctrlKey || event.metaKey) && (event.key === 'r' || event.key === 'R')) {
        event.preventDefault();
        // Reset all state
        setTechType('ml');
        setQ1Answer('');
        setQ2Answers({});
        setSelectedCharacteristics({});
        setCharacteristicStatus({});
        setSelectedControls({});
        setCustomControls({});
        setEvaluatingControls({});
        setCustomEvaluatingControls({});
        setNoRiskJustifications({});
        setOversightLevel('minimal');
        setInstitutionProfile('standard');
        setCollapsedGroups({});
        setCollapsedCharacteristics({});
        setShowDisclaimer(true); // Keep disclaimer on after reset
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ROBUST QUANTITATIVE SCORING SYSTEM
  const getTechnologyCharacteristics = useMemo(() => () => {
    if (!techCategories[techType] || !q1Answer) return [];
    
    const allCharacteristics = [...techCategories[techType].characteristics];
    const characteristicScores = new Map();
    
    // Initialize all characteristics with detailed scoring
    allCharacteristics.forEach(char => {
      characteristicScores.set(char.key, {
        baseScore: 0,
        phaseScore: 0,
        techScore: 0,
        q2Score: 0,
        contextScore: 0,
        profileModifier: 0,
        totalScore: 0,
        reasons: [],
        category: 'optional'
      });
    });
    
    // COMPREHENSIVE SCORING MATRICES
    
    // 1. PHASE-TECHNOLOGY INTERACTION MATRIX (0-15 points)
    const phaseTechMatrix = {
      discovery: {
        ml: {
          'training_data': 12, 'black_box': 8, 'patient_data': 10, 
          'multi_site': 6, 'rare_events': 7, 'continuous_learning': 5
        },
        llm: {
          'context_window': 10, 'training_data': 11, 'prompt_injection': 6,
          'hallucination': 8, 'external_api': 9, 'medical_knowledge': 5
        },
        imaging: {
          'diagnostic': 7, 'black_box': 9, 'quantitative': 8,
          'image_enhancement': 6, 'cad_detection': 5
        },
        wearables: {
          'continuous': 12, 'data_collection': 10, 'fitness_tracking': 8,
          'remote': 7, 'battery_critical': 5
        },
        apps: {
          'data_collection': 11, 'therapeutic': 6, 'behavioral_modification': 8,
          'coaching': 7, 'gamification': 5
        }
      },
      translational: {
        ml: {
          'clinical_decisions': 12, 'black_box': 10, 'vulnerable_populations': 9,
          'autonomous': 8, 'continuous_learning': 7, 'equity': 8
        },
        llm: {
          'hallucination': 13, 'medical_knowledge': 11, 'conversational': 10,
          'decision_support': 9, 'summarization': 8, 'patient_communication': 7
        },
        imaging: {
          'diagnostic': 12, 'triage': 10, 'real_time': 8,
          'progression_tracking': 9, 'screening': 7
        },
        wearables: {
          'vital_signs': 12, 'alerts': 10, 'remote': 11,
          'emergency_detection': 8, 'continuous': 9
        },
        apps: {
          'therapeutic': 12, 'mental_health': 10, 'chronic_disease': 9,
          'medication_mgmt': 8, 'social_features': 7
        }
      },
      clinical: {
        ml: {
          'clinical_decisions': 15, 'autonomous': 12, 'vulnerable_populations': 11,
          'equity': 10, 'transparency': 9, 'human_oversight': 8
        },
        llm: {
          'medical_knowledge': 14, 'hallucination': 15, 'clinical_integration': 12,
          'decision_support': 11, 'conversational': 10, 'prompt_injection': 9
        },
        imaging: {
          'diagnostic': 14, 'real_time': 12, 'emergency_detection': 11,
          'incidental': 10, 'radiation_reduction': 8
        },
        wearables: {
          'emergency_detection': 14, 'vital_signs': 13, 'alerts': 12,
          'battery_critical': 10, 'remote': 11
        },
        apps: {
          'mental_health': 13, 'substance_use': 12, 'medication_mgmt': 11,
          'therapeutic': 10, 'chronic_disease': 9
        }
      }
    };
    
    // 2. Q2 IMPACT MATRIX WITH BIDIRECTIONAL EFFECTS (-10 to +20 points)
    const q2ImpactMatrix = {
      // Universal impacts
      'vulnerable': { 
        'yes': { 
          'vulnerable_populations': 25, 'pediatric': 15, 'equity': 12,
          'transparency': 8, 'human_oversight': 10
        },
        'no': { 
          'standard_populations': 5, 'adult_focused': 3
        }
      },
      'autonomous': { 
        'yes': { 
          'autonomous': 25, 'clinical_decisions': 12, 'human_oversight': -8,
          'transparency': 10, 'trust': 8
        },
        'no': { 
          'human_oversight': 10, 'supervised': 8, 'manual_review': 5
        }
      },
      
      // Discovery phase questions
      'real_data': { 
        'yes': { 
          'patient_data': 18, 'training_data': 12, 'context_window': 10,
          'data_collection': 10, 'multi_site': 8
        },
        'no': { 
          'synthetic_data': 8, 'simulation': 6, 'privacy_preserved': 5
        }
      },
      'identifiable': { 
        'yes': { 
          'patient_data': 15, 'black_box': 12, 'transparency': 10,
          'data_sharing': -5, 'equity': 8
        },
        'no': { 
          'deidentified': 8, 'privacy': 6, 'aggregated': 5
        }
      },
      'future_use': {
        'yes': { 
          'clinical_decisions': 12, 'diagnostic': 10, 'medical_knowledge': 8,
          'decision_support': 10, 'regulatory_pathway': 8
        },
        'no': { 
          'research_only': 8, 'exploratory': 5, 'hypothesis_generating': 4
        }
      },
      'data_sharing': {
        'yes': { 
          'multi_site': 15, 'external_api': 12, 'patient_data': 8,
          'data_sharing': 12, 'transparency': 6
        },
        'no': { 
          'local_only': 8, 'data_security': 6, 'isolated': 5
        }
      },
      
      // Missing discovery questions
      'memorization': {
        'yes': { 
          'context_window': 12, 'patient_data': 10, 'training_data': 8,
          'continuous_learning': 10, 'data_collection': 8
        },
        'no': { 
          'stateless': 6, 'privacy_preserved': 8, 'ephemeral': 5
        }
      },
      'bias_testing': {
        'yes': { 
          'limited_demographics': -5, 'proprietary_algorithm': 8, 'confidence_scores': 6,
          'rare_events': 8, 'screening': 6
        },
        'no': { 
          'limited_demographics': 12, 'proprietary_algorithm': 10, 'black_box': 8
        }
      },
      
      // Translational phase questions
      'clinician_use': { 
        'yes': { 
          'clinical_decisions': 18, 'hallucination': 12, 'black_box': 10,
          'decision_support': 12, 'trust': 10, 'clinical_integration': 8
        },
        'no': { 
          'research_support': 8, 'educational': 5, 'observational': 4
        }
      },
      'pilot_patients': {
        'yes': { 
          'patient_data': 15, 'diagnostic': 12, 'clinical_decisions': 10,
          'real_time': 8, 'vital_signs': 8
        },
        'no': { 
          'simulated': 8, 'retrospective': 6, 'historical_data': 5
        }
      },
      'clinical_reliance': {
        'yes': { 
          'clinical_decisions': 15, 'diagnostic': 12, 'decision_support': 10,
          'confidence_scores': 8, 'proprietary_algorithm': 6
        },
        'no': { 
          'advisory_only': 6, 'supplemental': 5, 'informational': 4
        }
      },
      'patient_awareness': {
        'yes': { 
          'conversational': -3, 'patient_facing': -2, 'transparency': 8
        },
        'no': { 
          'conversational': 10, 'hallucination': 8, 'prompt_injection': 6
        }
      },
      'override': {
        'yes': { 
          'autonomous': -5, 'clinical_decisions': -3, 'batch_processing': 4
        },
        'no': { 
          'autonomous': 15, 'clinical_decisions': 10, 'emergency_detection': 8
        }
      },
      'feedback_loop': {
        'yes': { 
          'continuous_learning': 8, 'data_collection': 6, 'coaching': 5
        },
        'no': { 
          'static_model': 6, 'fixed_algorithm': 5
        }
      },
      
      // Clinical phase questions
      'treatment': { 
        'yes': { 
          'clinical_decisions': 20, 'diagnostic': 15, 'medical_knowledge': 14,
          'decision_support': 13, 'autonomous': 10
        },
        'no': { 
          'monitoring_only': 8, 'observational': 6, 'supportive': 5
        }
      },
      'critical': { 
        'yes': { 
          'emergency_detection': 20, 'real_time': 18, 'vital_signs': 15,
          'alerts': 16, 'battery_critical': 12
        },
        'no': { 
          'routine_care': 6, 'scheduled': 5, 'elective': 4
        }
      },
      'patient_facing': { 
        'yes': { 
          'conversational': 18, 'prompt_injection': 15, 'hallucination': 12,
          'patient_communication': 14, 'trust': 10
        },
        'no': { 
          'provider_only': 8, 'backend': 6, 'administrative': 4
        }
      },
      'monitoring': {
        'yes': { 
          'continuous': 8, 'alerts': 6, 'remote': 5,
          'data_collection': 6, 'real_time': 4
        },
        'no': { 
          'one_time': 6, 'static_deployment': 5, 'fixed_version': 4
        }
      }
    };
    
    // 3. CONTEXTUAL SYNERGY SCORING (0-10 bonus points)
    const contextualSynergies = [
      {
        conditions: ['vulnerable:yes', 'autonomous:yes'],
        bonus: { 'human_oversight': 10, 'transparency': 8, 'equity': 7 }
      },
      {
        conditions: ['critical:yes', 'autonomous:yes'],
        bonus: { 'emergency_detection': 10, 'human_oversight': 12, 'real_time': 8 }
      },
      {
        conditions: ['treatment:yes', 'patient_facing:yes'],
        bonus: { 'trust': 10, 'transparency': 8, 'clinical_integration': 6 }
      },
      {
        conditions: ['real_data:yes', 'data_sharing:yes'],
        bonus: { 'multi_site': 8, 'external_api': 7, 'data_governance': 9 }
      }
    ];
    
    // 4. INSTITUTION PROFILE MODIFIERS
    const profileSettings = {
      conservative: {
        multiplier: 1.3,
        thresholdAdjustment: -5,  // Lower thresholds for categories
        minCharacteristics: 10,
        forceInclude: ['limited_demographics', 'proprietary_algorithm', 'confidence_scores'],
        message: 'Conservative: comprehensive coverage'
      },
      standard: {
        multiplier: 1.0,
        thresholdAdjustment: 0,
        minCharacteristics: 7,
        forceInclude: [],
        message: 'Standard: balanced approach'
      },
      streamlined: {
        multiplier: 0.7,
        thresholdAdjustment: 5,  // Higher thresholds for categories
        minCharacteristics: 5,
        forceInclude: [],
        maxCharacteristics: 10,
        message: 'Streamlined: essential focus'
      }
    };
    
    const profile = profileSettings[institutionProfile];
    
    // APPLY SCORING
    
    // 1. Apply phase-technology scores
    const phaseTechScores = phaseTechMatrix[q1Answer]?.[techType] || {};
    Object.entries(phaseTechScores).forEach(([key, score]) => {
      if (characteristicScores.has(key)) {
        const scoreData = characteristicScores.get(key);
        scoreData.phaseScore = score;
        scoreData.reasons.push(`${q1Answer}-${techType}: +${score}`);
      }
    });
    
    // 2. Apply Q2 impact scores
    Object.entries(q2Answers).forEach(([question, answer]) => {
      const impacts = q2ImpactMatrix[question]?.[answer];
      if (impacts) {
        Object.entries(impacts).forEach(([charKey, points]) => {
          if (characteristicScores.has(charKey)) {
            const scoreData = characteristicScores.get(charKey);
            scoreData.q2Score += points;
            if (points !== 0) {
              scoreData.reasons.push(`${question}=${answer}: ${points > 0 ? '+' : ''}${points}`);
            }
          }
        });
      }
    });
    
    // 3. Apply contextual synergies
    contextualSynergies.forEach(synergy => {
      const allConditionsMet = synergy.conditions.every(condition => {
        const [q, a] = condition.split(':');
        return q2Answers[q] === a;
      });
      
      if (allConditionsMet) {
        Object.entries(synergy.bonus).forEach(([charKey, bonus]) => {
          if (characteristicScores.has(charKey)) {
            const scoreData = characteristicScores.get(charKey);
            scoreData.contextScore += bonus;
            scoreData.reasons.push(`synergy bonus: +${bonus}`);
          }
        });
      }
    });
    
    // 4. Apply technology base scores
    allCharacteristics.forEach(char => {
      if (characteristicScores.has(char.key)) {
        const scoreData = characteristicScores.get(char.key);
        scoreData.techScore = char.score * 3; // Base score from characteristic definition
        scoreData.reasons.push(`base severity: +${char.score * 3}`);
      }
    });
    
    // 5. Calculate totals and apply profile modifier
    const scoredCharacteristics = [];
    
    allCharacteristics.forEach(char => {
      const scoreData = characteristicScores.get(char.key);
      if (!scoreData) return;
      
      // Calculate raw total
      const rawTotal = scoreData.baseScore + scoreData.phaseScore + 
                      scoreData.techScore + scoreData.q2Score + scoreData.contextScore;
      
      // Apply profile modifier
      scoreData.totalScore = Math.round(rawTotal * profile.multiplier);
      
      // Force include certain characteristics for conservative profile
      if (profile.forceInclude.includes(char.key)) {
        scoreData.totalScore = Math.max(scoreData.totalScore, 15);
      }
      
      // Only include if score > threshold
      const threshold = institutionProfile === 'streamlined' ? 8 : 
                       institutionProfile === 'conservative' ? 3 : 5;
      
      if (scoreData.totalScore > threshold) {
        // Determine category based on adjusted thresholds
        let category;
        const criticalThreshold = 30 + profile.thresholdAdjustment;
        const importantThreshold = 20 + profile.thresholdAdjustment;
        const suggestedThreshold = 10 + profile.thresholdAdjustment;
        
        if (scoreData.totalScore >= criticalThreshold) {
          category = 'critical';
        } else if (scoreData.totalScore >= importantThreshold) {
          category = 'important';
        } else if (scoreData.totalScore >= suggestedThreshold) {
          category = 'suggested';
        } else {
          category = 'optional';
        }
        
        // Special overrides for critical items
        if (char.key === 'vulnerable_populations' && q2Answers.vulnerable === 'yes') {
          category = 'critical';
        }
        if (char.key === 'autonomous' && q2Answers.autonomous === 'yes') {
          category = 'critical';
        }
        if (char.key === 'emergency_detection' && (q2Answers.critical === 'yes' || q2Answers.emergency === 'yes')) {
          category = 'critical';
        }
        
        scoreData.category = category;
        
        scoredCharacteristics.push({
          ...char,
          category,
          totalScore: scoreData.totalScore,
          scoreBreakdown: scoreData.reasons.join(', '),
          controls: getRecommendedControls(char.key, techType) || []
        });
      }
    });
    
    // 6. Apply final filtering based on profile limits
    let finalCharacteristics = scoredCharacteristics;
    
    // Ensure minimum characteristics for profile
    if (finalCharacteristics.length < profile.minCharacteristics) {
      // Add more from the highest scoring excluded items
      const excluded = allCharacteristics
        .filter(c => !scoredCharacteristics.find(sc => sc.key === c.key))
        .map(c => ({
          ...c,
          totalScore: characteristicScores.get(c.key)?.totalScore || 0,
          category: 'optional'
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, profile.minCharacteristics - finalCharacteristics.length);
      
      finalCharacteristics = [...finalCharacteristics, ...excluded];
    }
    
    // Apply maximum for streamlined
    if (profile.maxCharacteristics && finalCharacteristics.length > profile.maxCharacteristics) {
      finalCharacteristics = finalCharacteristics
        .sort((a, b) => {
          // Keep critical items first
          if (a.category === 'critical' && b.category !== 'critical') return -1;
          if (b.category === 'critical' && a.category !== 'critical') return 1;
          return b.totalScore - a.totalScore;
        })
        .slice(0, profile.maxCharacteristics);
    }
    
    // 7. Final sort by category and score
    const categoryOrder = { critical: 0, important: 1, suggested: 2, optional: 3 };
    return finalCharacteristics.sort((a, b) => {
      const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
      if (categoryDiff !== 0) return categoryDiff;
      return b.totalScore - a.totalScore;
    });
  }, [techType, q1Answer, q2Answers, institutionProfile]);

  // Dynamic Q2 questions based on phase and profile
  const getDynamicQ2Questions = () => {
    if (!q1Answer) return [];
    
    const questionBank = {
      discovery: {
        core: [
          { key: 'real_data', text: 'Will you use actual patient records or data?', priority: 10 },
          { key: 'identifiable', text: 'Could someone figure out who a patient is?', priority: 9 },
          { key: 'future_use', text: 'Could this be used for patient care later?', priority: 8 }
        ],
        extended: [
          { key: 'data_sharing', text: 'Will data or results be shared outside your team?', priority: 7 },
          { key: 'memorization', text: 'Could the AI remember specific patient details?', priority: 6 },
          { key: 'bias_testing', text: 'Will you test for biases in the model?', priority: 5 }
        ]
      },
      translational: {
        core: [
          { key: 'clinician_use', text: 'Will doctors or nurses see what the AI says?', priority: 10 },
          { key: 'pilot_patients', text: 'Will you test this with real patients?', priority: 9 },
          { key: 'clinical_reliance', text: 'Might clinicians rely on this for decisions?', priority: 8 }
        ],
        extended: [
          { key: 'patient_awareness', text: 'Will patients know AI is being used?', priority: 7 },
          { key: 'override', text: 'Can clinicians easily ignore the AI advice?', priority: 6 },
          { key: 'feedback_loop', text: 'Will you collect feedback from users?', priority: 5 }
        ]
      },
      clinical: {
        core: [
          { key: 'treatment', text: 'Will this directly affect treatment decisions?', priority: 10 },
          { key: 'patient_facing', text: 'Will patients interact with the AI directly?', priority: 9 },
          { key: 'autonomous', text: 'Can the AI make decisions without human review?', priority: 8 }
        ],
        extended: [
          { key: 'critical', text: 'Will this be used in critical or emergency situations?', priority: 7 },
          { key: 'vulnerable', text: 'Will this involve vulnerable populations?', priority: 10 },
          { key: 'monitoring', text: 'Will you monitor AI performance over time?', priority: 5 }
        ]
      }
    };
    
    const phaseQuestions = questionBank[q1Answer];
    if (!phaseQuestions) return [];
    
    let questions = [...phaseQuestions.core];
    
    // Add extended questions based on profile
    if (institutionProfile === 'conservative') {
      questions = [...questions, ...phaseQuestions.extended];
    } else if (institutionProfile === 'standard') {
      questions = [...questions, ...phaseQuestions.extended.slice(0, 2)];
    }
    
    // Always include critical universal questions
    if (!questions.find(q => q.key === 'vulnerable')) {
      questions.push({ key: 'vulnerable', text: 'Will this involve vulnerable populations?', priority: 10 });
    }
    if (!questions.find(q => q.key === 'autonomous') && q1Answer !== 'discovery') {
      questions.push({ key: 'autonomous', text: 'Can the AI make decisions without human review?', priority: 8 });
    }
    
    // Sort by priority and limit based on profile
    questions.sort((a, b) => b.priority - a.priority);
    
    const maxQuestions = institutionProfile === 'streamlined' ? 5 :
                         institutionProfile === 'conservative' ? 8 : 6;
    
    return questions.slice(0, maxQuestions);
  };

  // Calculate oversight level with more nuanced logic
  useEffect(() => {
    if (!q1Answer) {
      setOversightLevel('minimal');
      return;
    }
    
    const characteristics = getTechnologyCharacteristics();
    const selectedChars = characteristics.filter(c => selectedCharacteristics[c.key]);
    
    // Comprehensive oversight calculation
    let oversightScore = 0;
    
    // Base score from phase
    const phaseScores = { discovery: 2, translational: 5, clinical: 8 };
    oversightScore += phaseScores[q1Answer] || 0;
    
    // Critical Q2 answers - ALL questions should impact oversight
    const criticalQ2 = {
      // High impact
      vulnerable: 5,
      autonomous: 4,
      treatment: 4,
      critical: 4,
      // Medium impact
      patient_facing: 3,
      clinician_use: 3,
      pilot_patients: 3,
      clinical_reliance: 3,
      // Lower impact
      real_data: 2,
      identifiable: 2,
      future_use: 2,
      data_sharing: 2,
      memorization: 2,
      patient_awareness: 1,
      override: -1,  // Negative because YES means less risk
      feedback_loop: 1,
      monitoring: 1,
      bias_testing: -1  // Negative because YES means reducing risk
    };
    
    Object.entries(criticalQ2).forEach(([key, points]) => {
      if (q2Answers[key] === 'yes') {
        oversightScore += points;
      }
    });
    
    // Selected characteristics impact
    const criticalChars = selectedChars.filter(c => c.category === 'critical').length;
    const importantChars = selectedChars.filter(c => c.category === 'important').length;
    const unaddressedCritical = selectedChars.filter(c => 
      c.category === 'critical' && !characteristicStatus[c.key]
    ).length;
    
    oversightScore += criticalChars * 2;
    oversightScore += importantChars;
    oversightScore += unaddressedCritical * 3;
    
    // Institution profile adjustment
    const profileAdjustment = {
      conservative: 3,
      standard: 0,
      streamlined: -2
    };
    oversightScore += profileAdjustment[institutionProfile];
    
    // Determine oversight level
    let level;
    if (oversightScore <= 5) level = 'minimal';
    else if (oversightScore <= 12) level = 'standard';
    else if (oversightScore <= 20) level = 'enhanced';
    else level = 'full';
    
    // Hard rules - never minimal for certain conditions
    if (q2Answers.vulnerable === 'yes' || q2Answers.autonomous === 'yes') {
      level = level === 'minimal' ? 'standard' : level;
    }
    
    // Clinical phase should rarely be minimal
    if (q1Answer === 'clinical' && level === 'minimal') {
      level = 'standard';
    }
    
    setOversightLevel(level);
  }, [q1Answer, q2Answers, selectedCharacteristics, characteristicStatus, institutionProfile]);

  // Auto-select critical characteristics
  useEffect(() => {
    const characteristics = getTechnologyCharacteristics();
    const newSelected = { ...selectedCharacteristics };
    
    // Only auto-select critical items
    characteristics.forEach(char => {
      if (char.category === 'critical') {
        newSelected[char.key] = true;
      }
    });
    
    // Clean up deselected characteristics
    Object.keys(newSelected).forEach(key => {
      if (!characteristics.find(c => c.key === key)) {
        delete newSelected[key];
      }
    });
    
    setSelectedCharacteristics(newSelected);
  }, [techType, q1Answer, q2Answers, institutionProfile]);

  // Group protocol requirements with more comprehensive categories
  const getGroupedRequirements = () => {
    const groups = {
      'Documentation Requirements': [],
      'Review & Approval': [],
      'Monitoring & Reporting': [],
      'Technical Controls': [],
      'Patient Protections': [],
      'Data Governance': [],
      'Quality Assurance': []
    };
    
    const characteristics = getTechnologyCharacteristics();
    const selectedChars = characteristics.filter(c => selectedCharacteristics[c.key]);
    
    // Add requirements based on characteristic status
    selectedChars.forEach(char => {
      const status = characteristicStatus[char.key];
      
      if (status === 'both') {
        // Handle both implemented and evaluating controls
        const controls = selectedControls[char.key] || [];
        const customControlList = customControls[char.key] || [];
        const evalControls = evaluatingControls[char.key] || [];
        const customEvalControls = customEvaluatingControls[char.key] || [];
        
        // Add implemented controls
        controls.forEach(control => {
          groups['Technical Controls'].push(`[Implemented] ${control}`);
        });
        customControlList.forEach(control => {
          groups['Technical Controls'].push(`[Implemented] ${control}`);
        });
        
        // Add controls to evaluate
        evalControls.forEach(control => {
          groups['Technical Controls'].push(`[To Evaluate] ${control}`);
        });
        customEvalControls.forEach(control => {
          groups['Technical Controls'].push(`[To Evaluate] ${control}`);
        });
        
        if (controls.length === 0 && customControlList.length === 0 && evalControls.length === 0 && customEvalControls.length === 0) {
          groups['Technical Controls'].push(`Define controls for ${char.name}`);
        }
        
        groups['Documentation Requirements'].push(`Mixed control strategy for ${char.name}`);
        groups['Monitoring & Reporting'].push(`Track both implemented and experimental controls for ${char.name}`);
        groups['Quality Assurance'].push(`Validate existing controls, evaluate new controls for ${char.name}`);
      } else if (status === 'evaluating') {
        // Add the controls being evaluated
        const evalControls = evaluatingControls[char.key] || [];
        const customEvalControls = customEvaluatingControls[char.key] || [];
        
        groups['Documentation Requirements'].push(`Study protocol for evaluating ${char.name} controls`);
        
        evalControls.forEach(control => {
          groups['Technical Controls'].push(`[To Evaluate] ${control}`);
        });
        
        customEvalControls.forEach(control => {
          groups['Technical Controls'].push(`[To Evaluate] ${control}`);
        });
        
        if (evalControls.length === 0 && customEvalControls.length === 0) {
          groups['Technical Controls'].push(`Select controls to evaluate for ${char.name}`);
        }
        
        groups['Monitoring & Reporting'].push(`Metrics for ${char.name} control effectiveness`);
        groups['Quality Assurance'].push(`Success criteria for ${char.name} controls`);
        groups['Review & Approval'].push(`IRB review of control evaluation protocol`);
      } else if (status === 'no_risk') {
        groups['Documentation Requirements'].push(`Justification required: Why ${char.name} poses no risk`);
        groups['Review & Approval'].push(`Committee review of ${char.name} N/A determination`);
      } else if (status === 'mitigated') {
        // Add the actual selected controls
        const controls = selectedControls[char.key] || [];
        const customControlList = customControls[char.key] || [];
        
        controls.forEach(control => {
          groups['Technical Controls'].push(control);
        });
        
        customControlList.forEach(customControl => {
          groups['Technical Controls'].push(customControl);
        });
        
        if (controls.length === 0 && customControlList.length === 0) {
          groups['Technical Controls'].push(`Define controls for ${char.name}`);
        }
        
        groups['Quality Assurance'].push(`Monitor effectiveness of ${char.name} controls`);
      }
    });
    
    // Add Q2-based requirements
    if (q2Answers.vulnerable === 'yes') {
      groups['Patient Protections'].push('Vulnerable population safeguards protocol');
      groups['Review & Approval'].push('Ethics committee special review');
      groups['Documentation Requirements'].push('Vulnerable population impact assessment');
    }
    
    if (q2Answers.autonomous === 'yes') {
      groups['Technical Controls'].push('Human override mechanism');
      groups['Monitoring & Reporting'].push('Autonomous decision audit log');
      groups['Quality Assurance'].push('Decision accuracy validation');
    }
    
    if (q2Answers.real_data === 'yes') {
      groups['Data Governance'].push('Data use agreement');
      groups['Patient Protections'].push('Privacy protection measures');
      groups['Documentation Requirements'].push('Data handling procedures');
    }
    
    // Oversight level requirements
    const oversightRequirements = {
      minimal: {
        'Review & Approval': ['Expedited review pathway'],
        'Monitoring & Reporting': ['Annual progress report']
      },
      standard: {
        'Review & Approval': ['Full committee review'],
        'Monitoring & Reporting': ['Quarterly progress reports'],
        'Quality Assurance': ['Regular audit schedule']
      },
      enhanced: {
        'Review & Approval': ['Multi-committee review', 'External expert consultation'],
        'Monitoring & Reporting': ['Monthly progress reports', 'Adverse event reporting'],
        'Quality Assurance': ['Continuous monitoring program']
      },
      full: {
        'Review & Approval': ['Board review required', 'DSMB establishment'],
        'Monitoring & Reporting': ['Real-time monitoring', 'Weekly status reports'],
        'Quality Assurance': ['Third-party validation', 'Regulatory compliance audit']
      }
    };
    
    const levelReqs = oversightRequirements[oversightLevel] || {};
    Object.entries(levelReqs).forEach(([group, reqs]) => {
      groups[group] = [...groups[group], ...reqs];
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  };

  const handleReset = () => {
    setTechType('ml');
    setQ1Answer('');
    setQ2Answers({});
    setSelectedCharacteristics({});
    setCharacteristicStatus({});
    setSelectedControls({});
    setCustomControls({});
    setNoRiskJustifications({});
    setOversightLevel('minimal');
    setInstitutionProfile('standard');
    setCollapsedGroups({});
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 'r') {
        handleReset();
      }
      if (e.key.toLowerCase() === 'd') {
        setShowDisclaimer(!showDisclaimer);
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [showDisclaimer]);

  return (
    <SlideWrapper slideTitle="Building Your Technology Checklist" slideNumber={19} totalSlides={20}>
      {showDisclaimer && (
        <DisclaimerWatermark>
          <div style={{
            border: '8px solid rgba(220, 20, 20, 0.9)',
            borderRadius: '12px',
            padding: '30px 40px',
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              color: 'rgba(220, 20, 20, 1)',
              fontFamily: 'Impact, Arial Black, sans-serif',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
              Work In Progress
            </div>
            
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'rgba(30, 30, 30, 0.9)'
            }}>
              Final Version: EOY 2025
            </div>
            
            <div style={{
              fontSize: '18px',
              color: 'rgba(30, 30, 30, 0.85)',
              fontWeight: '600',
              fontStyle: 'italic'
            }}>
              Seeking Collaborators & Feedback
            </div>
            
          </div>
        </DisclaimerWatermark>
      )}
      
      <ContentContainer>
        <ProfileToggleContainer>
          <ProfileLabel>Institution Risk Profile:</ProfileLabel>
          <ProfileToggle>
            <ProfileOption
              $active={institutionProfile === 'conservative'}
              $profile="conservative"
              onClick={() => setInstitutionProfile('conservative')}
            >
              Conservative
            </ProfileOption>
            <ProfileOption
              $active={institutionProfile === 'standard'}
              $profile="standard"
              onClick={() => setInstitutionProfile('standard')}
            >
              Standard
            </ProfileOption>
            <ProfileOption
              $active={institutionProfile === 'streamlined'}
              $profile="streamlined"
              onClick={() => setInstitutionProfile('streamlined')}
            >
              Streamlined
            </ProfileOption>
          </ProfileToggle>
          <ProfileDescription $profile={institutionProfile}>
            {institutionProfile === 'conservative' && 'More oversight, broader review'}
            {institutionProfile === 'standard' && 'Balanced approach'}
            {institutionProfile === 'streamlined' && 'Focused essentials only'}
          </ProfileDescription>
        </ProfileToggleContainer>

        <Subtitle>
          Answer questions to build <span>personalized requirements</span> based on your technology and use case
        </Subtitle>

        <MainContainer>
          {/* Panel 1: Context Questions */}
          <Panel>
            <PanelTitle>
              <StepBadge $color="#4AE2C0">1</StepBadge>
              Define Your Context
            </PanelTitle>
            
            <QuestionGroup>
              <QuestionLabel>What type of AI technology?</QuestionLabel>
              <Select value={techType} onChange={(e) => setTechType(e.target.value)}>
                <option value="ml">Machine Learning (ML)</option>
                <option value="llm">Large Language Model (LLM)</option>
                <option value="imaging">Medical Imaging AI</option>
                <option value="wearables">Wearables/Sensors</option>
                <option value="apps">Digital Health Apps</option>
              </Select>
            </QuestionGroup>

            <QuestionGroup>
              <QuestionLabel $color="#FFD93D">Q1: What phase is your research?</QuestionLabel>
              <RadioGroup>
                <RadioOption>
                  <input
                    type="radio"
                    name="phase"
                    value="discovery"
                    checked={q1Answer === 'discovery'}
                    onChange={(e) => setQ1Answer(e.target.value)}
                  />
                  Discovery/Feasibility
                </RadioOption>
                <RadioOption>
                  <input
                    type="radio"
                    name="phase"
                    value="translational"
                    checked={q1Answer === 'translational'}
                    onChange={(e) => setQ1Answer(e.target.value)}
                  />
                  Translational/Pilot
                </RadioOption>
                <RadioOption>
                  <input
                    type="radio"
                    name="phase"
                    value="clinical"
                    checked={q1Answer === 'clinical'}
                    onChange={(e) => setQ1Answer(e.target.value)}
                  />
                  Clinical Validation
                </RadioOption>
              </RadioGroup>
            </QuestionGroup>

            {q1Answer && (
              <QuestionGroup>
                <QuestionLabel $color="#FFD93D">Q2: Key Questions</QuestionLabel>
                {getDynamicQ2Questions().map((question) => (
                  <YesNoQuestion key={question.key}>
                    <YesNoText>{question.text}</YesNoText>
                    <YesNoButtons>
                      <YesNoButton
                        $active={q2Answers[question.key] === 'yes'}
                        $yes={true}
                        onClick={() => setQ2Answers({...q2Answers, [question.key]: 'yes'})}
                      >
                        Yes
                      </YesNoButton>
                      <YesNoButton
                        $active={q2Answers[question.key] === 'no'}
                        $yes={false}
                        onClick={() => setQ2Answers({...q2Answers, [question.key]: 'no'})}
                      >
                        No
                      </YesNoButton>
                    </YesNoButtons>
                  </YesNoQuestion>
                ))}
              </QuestionGroup>
            )}
          </Panel>

          {/* Panel 2: Technology Characteristics */}
          <Panel>
            <PanelTitle>
              <StepBadge $color="#FF6B6B">2</StepBadge>
              Identify Characteristics & Risk Approach
            </PanelTitle>
            
            {q1Answer ? (
              getTechnologyCharacteristics().length > 0 ? (
                getTechnologyCharacteristics().map((char) => (
                  <CharacteristicWrapper key={char.key}>
                    <CategoryBadge $category={char.category}>
                      {char.category === 'critical' ? 'Critical' :
                       char.category === 'important' ? 'Important' :
                       char.category === 'suggested' ? 'Suggested' :
                       'Consider'}
                    </CategoryBadge>
                    
                    <CharacteristicItem 
                      $selected={selectedCharacteristics[char.key]}
                      $category={char.category}
                    >
                      <CharacteristicHeader>
                        <CharacteristicCheckbox
                          type="checkbox"
                          id={char.key}
                          checked={selectedCharacteristics[char.key] || false}
                          disabled={char.category === 'critical'}
                          onChange={(e) => {
                            if (char.category !== 'critical') {
                              setSelectedCharacteristics({
                                ...selectedCharacteristics,
                                [char.key]: e.target.checked
                              });
                            }
                          }}
                        />
                        <CharacteristicLabel 
                          htmlFor={char.key}
                          $disabled={char.category === 'critical'}
                        >
                          {char.name}
                        </CharacteristicLabel>
                        {selectedCharacteristics[char.key] && characteristicStatus[char.key] && (
                          <button
                            style={{
                              marginLeft: 'auto',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '4px',
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: '10px',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              setCollapsedCharacteristics({
                                ...collapsedCharacteristics,
                                [char.key]: !collapsedCharacteristics[char.key]
                              });
                            }}
                            onMouseOver={(e) => e.target.style.color = 'white'}
                            onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
                          >
                            {collapsedCharacteristics[char.key] ? 'Expand ▼' : 'Collapse ▲'}
                          </button>
                        )}
                      </CharacteristicHeader>
                      
                      {!collapsedCharacteristics[char.key] && (
                        <CharacteristicDescription>{char.desc}</CharacteristicDescription>
                      )}
                      
                      {selectedCharacteristics[char.key] && !collapsedCharacteristics[char.key] && (
                        <ControlStatusDropdown
                          value={characteristicStatus[char.key] || ''}
                          onChange={(e) => setCharacteristicStatus({
                            ...characteristicStatus,
                            [char.key]: e.target.value
                          })}
                        >
                          <option value="">How will you address risks?</option>
                          <option value="both">Some controls in place, testing others</option>
                          <option value="mitigated">All controls in place</option>
                          <option value="evaluating">Testing controls in study</option>
                          <option value="no_risk">No risk - N/A</option>
                        </ControlStatusDropdown>
                      )}
                      
                      {selectedCharacteristics[char.key] && characteristicStatus[char.key] === 'both' && !collapsedCharacteristics[char.key] && (
                        <div>
                          <ControlSelectionContainer style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#4AE2C0', marginBottom: '6px' }}>
                              Controls already implemented:
                            </div>
                            {getRecommendedControls(techType, [char.key], 
                              char.category === 'critical' ? 6 : 
                              char.category === 'important' ? 4 : 2
                            ).map(control => (
                              control.controls.map((ctrl, idx) => (
                                <ControlCheckbox key={`${char.key}-${idx}`}>
                                  <input
                                    type="checkbox"
                                    checked={selectedControls[char.key]?.includes(ctrl) || false}
                                    onChange={(e) => {
                                      const current = selectedControls[char.key] || [];
                                      if (e.target.checked) {
                                        setSelectedControls({
                                          ...selectedControls,
                                          [char.key]: [...current, ctrl]
                                        });
                                      } else {
                                        setSelectedControls({
                                          ...selectedControls,
                                          [char.key]: current.filter(c => c !== ctrl)
                                        });
                                      }
                                    }}
                                  />
                                  <span style={{ wordBreak: 'break-word' }}>{ctrl}</span>
                                </ControlCheckbox>
                              ))))}
                            {(customControls[char.key] || []).map((customCtrl, idx) => (
                              <ControlCheckbox key={`${char.key}-custom-${idx}`}>
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={(e) => {
                                    if (!e.target.checked) {
                                      setCustomControls({
                                        ...customControls,
                                        [char.key]: customControls[char.key].filter((_, i) => i !== idx)
                                      });
                                    }
                                  }}
                                />
                                <span style={{ wordBreak: 'break-word' }}>{customCtrl}</span>
                              </ControlCheckbox>
                            ))}
                            <CustomControlInput
                              type="text"
                              placeholder="Add implemented control (press Enter)..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  e.preventDefault();
                                  const current = customControls[char.key] || [];
                                  setCustomControls({
                                    ...customControls,
                                    [char.key]: [...current, e.target.value.trim()]
                                  });
                                  e.target.value = '';
                                }
                              }}
                              style={{ marginTop: '6px' }}
                            />
                          </ControlSelectionContainer>
                          
                          <ControlSelectionContainer style={{ borderColor: 'rgba(255, 193, 61, 0.3)' }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#FFD93D', marginBottom: '6px' }}>
                              Controls to evaluate in study:
                            </div>
                            {getRecommendedControls(techType, [char.key], 
                              char.category === 'critical' ? 6 : 
                              char.category === 'important' ? 4 : 2
                            ).map(control => (
                              control.controls.map((ctrl, idx) => (
                                <ControlCheckbox key={`${char.key}-eval-${idx}`}>
                                  <input
                                    type="checkbox"
                                    checked={evaluatingControls[char.key]?.includes(ctrl) || false}
                                    onChange={(e) => {
                                      const current = evaluatingControls[char.key] || [];
                                      if (e.target.checked) {
                                        setEvaluatingControls({
                                          ...evaluatingControls,
                                          [char.key]: [...current, ctrl]
                                        });
                                      } else {
                                        setEvaluatingControls({
                                          ...evaluatingControls,
                                          [char.key]: current.filter(c => c !== ctrl)
                                        });
                                      }
                                    }}
                                  />
                                  <span style={{ wordBreak: 'break-word' }}>{ctrl}</span>
                                </ControlCheckbox>
                              ))
                            ))}
                            {(customEvaluatingControls[char.key] || []).map((customCtrl, idx) => (
                              <ControlCheckbox key={`${char.key}-custom-eval-${idx}`}>
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={(e) => {
                                    if (!e.target.checked) {
                                      setCustomEvaluatingControls({
                                        ...customEvaluatingControls,
                                        [char.key]: customEvaluatingControls[char.key].filter((_, i) => i !== idx)
                                      });
                                    }
                                  }}
                                />
                                <span style={{ wordBreak: 'break-word' }}>{customCtrl}</span>
                              </ControlCheckbox>
                            ))}
                            <CustomControlInput
                              type="text"
                              placeholder="Add control to evaluate (press Enter)..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  e.preventDefault();
                                  const current = customEvaluatingControls[char.key] || [];
                                  setCustomEvaluatingControls({
                                    ...customEvaluatingControls,
                                    [char.key]: [...current, e.target.value.trim()]
                                  });
                                  e.target.value = '';
                                }
                              }}
                              style={{ marginTop: '6px' }}
                            />
                          </ControlSelectionContainer>
                        </div>
                      )}
                      
                      {selectedCharacteristics[char.key] && characteristicStatus[char.key] === 'mitigated' && !collapsedCharacteristics[char.key] && (
                        <ControlSelectionContainer>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#4AE2C0', marginBottom: '6px' }}>
                            Select implemented controls:
                          </div>
                          {getRecommendedControls(techType, [char.key], 
                            char.category === 'critical' ? 6 : 
                            char.category === 'important' ? 4 : 2
                          ).map(control => (
                            control.controls.map((ctrl, idx) => (
                              <ControlCheckbox key={`${char.key}-${idx}`}>
                                <input
                                  type="checkbox"
                                  checked={selectedControls[char.key]?.includes(ctrl) || false}
                                  onChange={(e) => {
                                    const current = selectedControls[char.key] || [];
                                    if (e.target.checked) {
                                      setSelectedControls({
                                        ...selectedControls,
                                        [char.key]: [...current, ctrl]
                                      });
                                    } else {
                                      setSelectedControls({
                                        ...selectedControls,
                                        [char.key]: current.filter(c => c !== ctrl)
                                      });
                                    }
                                  }}
                                />
                                <span style={{ wordBreak: 'break-word' }}>{ctrl}</span>
                              </ControlCheckbox>
                            ))))}
                          {/* Show custom controls as checkboxes */}
                          {(customControls[char.key] || []).map((customCtrl, idx) => (
                            <ControlCheckbox key={`${char.key}-custom-${idx}`}>
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    setCustomControls({
                                      ...customControls,
                                      [char.key]: customControls[char.key].filter((_, i) => i !== idx)
                                    });
                                  }
                                }}
                              />
                              <span style={{ wordBreak: 'break-word' }}>{customCtrl}</span>
                            </ControlCheckbox>
                          ))}
                          <CustomControlInput
                            type="text"
                            placeholder="Add custom control (press Enter)..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                e.preventDefault();
                                const current = customControls[char.key] || [];
                                setCustomControls({
                                  ...customControls,
                                  [char.key]: [...current, e.target.value.trim()]
                                });
                                e.target.value = '';
                              }
                            }}
                            style={{ marginTop: '6px' }}
                          />
                        </ControlSelectionContainer>
                      )}
                      
                      {selectedCharacteristics[char.key] && characteristicStatus[char.key] === 'evaluating' && !collapsedCharacteristics[char.key] && (
                        <ControlSelectionContainer style={{ borderColor: 'rgba(255, 193, 61, 0.3)' }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#FFD93D', marginBottom: '6px' }}>
                            Select controls to evaluate in study:
                          </div>
                          {getRecommendedControls(techType, [char.key], 
                            char.category === 'critical' ? 6 : 
                            char.category === 'important' ? 4 : 2
                          ).map(control => (
                            control.controls.map((ctrl, idx) => (
                              <ControlCheckbox key={`${char.key}-eval-${idx}`}>
                                <input
                                  type="checkbox"
                                  checked={evaluatingControls[char.key]?.includes(ctrl) || false}
                                  onChange={(e) => {
                                    const current = evaluatingControls[char.key] || [];
                                    if (e.target.checked) {
                                      setEvaluatingControls({
                                        ...evaluatingControls,
                                        [char.key]: [...current, ctrl]
                                      });
                                    } else {
                                      setEvaluatingControls({
                                        ...evaluatingControls,
                                        [char.key]: current.filter(c => c !== ctrl)
                                      });
                                    }
                                  }}
                                />
                                <span style={{ wordBreak: 'break-word' }}>{ctrl}</span>
                              </ControlCheckbox>
                            ))))}
                          {/* Show custom controls being evaluated as checkboxes */}
                          {(customEvaluatingControls[char.key] || []).map((customCtrl, idx) => (
                            <ControlCheckbox key={`${char.key}-custom-eval-${idx}`}>
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    setCustomEvaluatingControls({
                                      ...customEvaluatingControls,
                                      [char.key]: customEvaluatingControls[char.key].filter((_, i) => i !== idx)
                                    });
                                  }
                                }}
                              />
                              <span style={{ wordBreak: 'break-word' }}>{customCtrl}</span>
                            </ControlCheckbox>
                          ))}
                          <CustomControlInput
                            type="text"
                            placeholder="Add control to evaluate (press Enter)..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                e.preventDefault();
                                const current = customEvaluatingControls[char.key] || [];
                                setCustomEvaluatingControls({
                                  ...customEvaluatingControls,
                                  [char.key]: [...current, e.target.value.trim()]
                                });
                                e.target.value = '';
                              }
                            }}
                            style={{ marginTop: '6px' }}
                          />
                        </ControlSelectionContainer>
                      )}
                    </CharacteristicItem>
                  </CharacteristicWrapper>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '40px 20px' }}>
                  Answer more questions to see relevant characteristics
                </div>
              )
            ) : (
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '40px 20px' }}>
                Complete Q1 to see relevant technology characteristics
              </div>
            )}
          </Panel>

          {/* Panel 3: Protocol Requirements */}
          <Panel>
            <PanelTitle>
              <StepBadge $color="#9B59B6">3</StepBadge>
              Your Protocol Requirements
            </PanelTitle>
            
            <div style={{ 
              padding: '8px 12px', 
              background: oversightLevel === 'minimal' ? 'rgba(30, 136, 229, 0.1)' :
                          oversightLevel === 'standard' ? 'rgba(74, 226, 192, 0.1)' :
                          oversightLevel === 'enhanced' ? 'rgba(255, 193, 61, 0.1)' :
                          'rgba(255, 107, 107, 0.1)',
              borderRadius: '6px',
              marginBottom: '15px',
              border: `1px solid ${
                oversightLevel === 'minimal' ? 'rgba(30, 136, 229, 0.3)' :
                oversightLevel === 'standard' ? 'rgba(74, 226, 192, 0.3)' :
                oversightLevel === 'enhanced' ? 'rgba(255, 193, 61, 0.3)' :
                'rgba(255, 107, 107, 0.3)'
              }`
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                IRB Oversight Level: {oversightLevel.toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)' }}>
                {oversightLevel === 'minimal' && 'Expedited review, minimal reporting'}
                {oversightLevel === 'standard' && 'Standard review process'}
                {oversightLevel === 'enhanced' && 'Additional safeguards required'}
                {oversightLevel === 'full' && 'Comprehensive review and monitoring'}
              </div>
            </div>
            
            {Object.entries(getGroupedRequirements()).map(([groupName, items]) => (
              items.length > 0 && (
                <RequirementGroup key={groupName}>
                  <RequirementHeader 
                    onClick={() => setCollapsedGroups({
                      ...collapsedGroups,
                      [groupName]: !collapsedGroups[groupName]
                    })}
                  >
                    <RequirementTitle>{groupName}</RequirementTitle>
                    <RequirementCount>{items.length}</RequirementCount>
                  </RequirementHeader>
                  <RequirementList $collapsed={collapsedGroups[groupName]}>
                    {items.map((item, idx) => (
                      <RequirementItem key={idx}>{item}</RequirementItem>
                    ))}
                  </RequirementList>
                </RequirementGroup>
              )))}
          </Panel>
        </MainContainer>
      </ContentContainer>

      <InteractionHint>
        <kbd>Ctrl</kbd>+<kbd>R</kbd> Reset <span className="separator">•</span> <kbd>Ctrl</kbd>+<kbd>D</kbd> Disclaimer <span className="separator">•</span> <kbd>←</kbd> <kbd>→</kbd> Navigate
      </InteractionHint>

      <Notes>
        Practical implementation checklist with robust filtering:
        - Multi-dimensional scoring system
        - Phase-technology interaction matrix
        - Contextual synergy bonuses
        - Bidirectional Q2 impacts (Yes and No both matter)
        - Institution profile significantly affects filtering
        - Dynamic question generation based on context
        - Comprehensive requirement categorization
      </Notes>
    </SlideWrapper>
  );
};

export default Slide19PracticalChecklist;