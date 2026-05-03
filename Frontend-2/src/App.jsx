
import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import * as api from './api.js';
import HospitalMap from './HospitalMap.jsx';

// --- MOCK DATA ---
const historyData = [
  { id: 1, title: 'Headache & high fever', summary: 'Reported persistent headache with 103°F fever and body aches for 2 days.', severity: 'medium', advice: 'Rest, hydration, paracetamol. Visit doctor if fever persists >3 days.', time: '2 hours ago', date: '2025-04-27' },
  { id: 2, title: 'Chest pain & shortness of breath', summary: 'Sudden chest pain radiating to left arm with difficulty breathing.', severity: 'high', advice: 'EMERGENCY — Seek immediate medical attention. Called ambulance.', time: 'Yesterday', date: '2025-04-26' },
  { id: 3, title: 'Seasonal allergy symptoms', summary: 'Sneezing, runny nose, watery eyes — worse in mornings.', severity: 'low', advice: 'Antihistamines, avoid allergens, HEPA filter recommended.', time: '3 days ago', date: '2025-04-24' },
  { id: 4, title: 'Lower back pain', summary: 'Mild lower back pain after long sitting hours at desk job.', severity: 'low', advice: 'Stretching exercises, ergonomic chair, warm compress.', time: '5 days ago', date: '2025-04-22' },
  { id: 5, title: 'Stomach pain & vomiting', summary: 'Abdominal cramps with nausea and 3 episodes of vomiting.', severity: 'medium', advice: 'ORS for hydration, bland diet, antacid. Consult if worsens.', time: '1 week ago', date: '2025-04-20' }
];

const langMap = {
  en: 'Responding in English',
  hi: 'हिंदी में जवाब दे रहे हैं',
  bn: 'বাংলায় উত্তর দিচ্ছি',
  ta: 'தமிழில் பதிலளிக்கிறேன்',
  te: 'తెలుగులో జవాబు ఇస్తున్నాను',
  mr: 'मराठीत उत्तर देत आहे'
};

// --- COMPONENTS ---

const Navbar = ({ currentPage, showPage, user }) => {
  return (
    <nav>
      <div className="nav-brand" onClick={() => showPage('home')}>
        <div className="nav-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <span className="nav-name">VITALIS <span>AI</span></span>
      </div>
      <div className="nav-links">
        <button className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => showPage('home')}>Home</button>
        <button className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`} onClick={() => showPage('chat')}>Consult AI</button>
        <button className={`nav-link ${currentPage === 'history' ? 'active' : ''}`} onClick={() => showPage('history')}>History</button>
        <button className={`nav-link ${currentPage === 'about' ? 'active' : ''}`} onClick={() => showPage('about')}>About</button>
        <button className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => showPage('contact')}>Contact</button>
        {user ? (
          <button className={`nav-link ${currentPage === 'account' ? 'active' : ''}`} onClick={() => showPage('account')} style={{ fontWeight: 600, color: 'var(--primary)' }}>My Account</button>
        ) : (
          <button className={`nav-link ${currentPage === 'auth' ? 'active' : ''}`} onClick={() => showPage('auth')} style={{ fontWeight: 600, color: 'var(--primary)' }}>Sign In</button>
        )}
      </div>
      <button className="nav-cta" onClick={() => showPage('chat')}>Start Free Consultation →</button>
    </nav>
  );
};

const HomePage = ({ showPage }) => {
  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current || !glowRef.current || !containerRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      glowRef.current.style.left = x + 'px';
      glowRef.current.style.top = y + 'px';
      glowRef.current.style.transform = 'translate(-50%, -50%)';

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((centerY - y) / centerY) * 10;
      const rotateY = ((x - centerX) / centerX) * 10;

      containerRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
      if (containerRef.current) {
        containerRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
      }
    };

    const hero = heroRef.current;
    if (hero) {
      hero.addEventListener('mousemove', handleMouseMove);
      hero.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (hero) {
        hero.removeEventListener('mousemove', handleMouseMove);
        hero.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="page active" id="page-home">
      <div className="hero" ref={heroRef}>
        <div className="hero-bg-glow" ref={glowRef}></div>
        <div className="hero-particles">
          {Array.from({ length: 30 }).map((_, i) => (
            <div 
              key={i} 
              className="particle-dot" 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 5}s`
              }} 
            />
          ))}
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              AI-Powered Healthcare · 6 Languages Supported
            </div>
            <h1>Healthcare <em>for everyone,</em><br/>everywhere</h1>
            <p>Instant AI triage, multilingual symptom assessment, and nearest hospital finder — bringing quality healthcare guidance to 900 million underserved rural citizens.</p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => showPage('chat')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Start Symptom Checker
              </button>
              <button className="btn-outline" onClick={() => showPage('about')}>Learn More →</button>
            </div>
          </div>

          <div className="hero-visuals">
            <div className="hologram-container" ref={containerRef}>
              <div className="hologram-avatar">
                <div className="avatar-head"></div>
                <div className="avatar-body"></div>
                
                <div className="ecg-line">
                  <svg preserveAspectRatio="none" viewBox="0 0 400 40">
                     <path d="M0,20 L40,20 L50,0 L60,40 L70,10 L80,20 L200,20 L240,20 L250,0 L260,40 L270,10 L280,20 L400,20" />
                  </svg>
                </div>
                
                <div style={{marginTop: '-5px', fontSize: '12px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', textShadow: 'none'}}>
                   VITALIS AI Core
                </div>
              </div>
            </div>

            <div className="glass-card card-left">
               <div style={{fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <span style={{width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 5px rgba(46,196,182,0.5)', display: 'inline-block'}}></span> AI Triage
               </div>
               <div style={{fontSize: '14px', fontWeight: 600}}>Status: Active</div>
               <div className="voice-wave-container" style={{marginTop: '8px'}}>
                   <div className="hero-wave-bar"></div><div className="hero-wave-bar"></div><div className="hero-wave-bar"></div><div className="hero-wave-bar"></div>
               </div>
            </div>

            <div className="glass-card card-right">
               <div style={{fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <span style={{width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 5px rgba(46,196,182,0.5)', display: 'inline-block'}}></span> Server Node
               </div>
               <div style={{fontSize: '24px', fontFamily: "'DM Serif Display', serif"}}>99.9%</div>
               <div style={{fontSize: '11px', opacity: 0.7}}>System Uptime</div>
            </div>

            <div className="glass-card card-top">
               <div style={{fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span>Encrypted JWT</span>
               </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

const ChatPage = ({ showPage, showToast }) => {
  const [currentLang, setCurrentLang] = useState('en');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'ai',
      time: 'Just now',
      content: (
        <>
          <strong>Hello! I'm VITALIS AI</strong> 👋<br/><br/>
          I'm here to help you assess your health symptoms and guide you toward appropriate care. Please describe what you're experiencing and I'll provide a preliminary assessment.<br/><br/>
          <em style={{color: 'var(--text-muted)', fontSize: '13px'}}>⚠️ This is not a substitute for professional medical advice. Always consult a qualified doctor for diagnosis.</em>
        </>
      )
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSeverity, setCurrentSeverity] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [sidebarHistory, setSidebarHistory] = useState([
    { id: 1, title: 'Current Session', time: 'Just now', severity: 'low', active: true },
    { id: 2, title: 'Headache & fever symptoms', time: '2 hours ago', severity: 'medium' },
    { id: 3, title: 'Chest pain consultation', time: 'Yesterday', severity: 'high' },
    { id: 4, title: 'Seasonal allergy symptoms', time: '3 days ago', severity: 'low' }
  ]);
  const [messageCount, setMessageCount] = useState(0);
  const [speakingId, setSpeakingId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Preload voices on mount
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() || []);
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const speakText = (text, msgId) => {
    if (!window.speechSynthesis) {
      showToast('Text-to-speech not supported in this browser');
      return;
    }
    // If already speaking this message, stop it
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langCodes = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN' };
    const langCode = langCodes[currentLang] || 'en-IN';
    const baseLang = langCode.split('-')[0]; // e.g. 'hi', 'bn'
    utterance.lang = langCode;
    // Find best matching FEMALE voice - try exact lang, then base lang
    const availableVoices = voices.length ? voices : (window.speechSynthesis.getVoices() || []);
    const isFemale = (v) => /female/i.test(v.name) || /woman|girl|zira|heera|swara|lekha|meera|priya|samantha|google.*female/i.test(v.name);
    const matchingVoice = availableVoices.find(v => v.lang === langCode && isFemale(v))
      || availableVoices.find(v => v.lang.startsWith(baseLang + '-') && isFemale(v))
      || availableVoices.find(v => v.lang.startsWith(baseLang) && isFemale(v))
      || availableVoices.find(v => v.lang === langCode)
      || availableVoices.find(v => v.lang.startsWith(baseLang + '-'))
      || availableVoices.find(v => v.lang.startsWith(baseLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
      utterance.lang = matchingVoice.lang; // use the exact lang the voice supports
    }
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInput = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fillInput = (text) => {
    setInputText(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const newChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        type: 'ai',
        time: 'Just now',
        content: (
          <>
            <strong>New consultation started!</strong><br/><br/>
            Hello! I'm ready to help you assess your symptoms. Please describe what you're experiencing today.
            <br/><br/><em style={{color: 'var(--text-muted)', fontSize: '13px'}}>⚠️ Not a substitute for professional medical advice.</em>
          </>
        )
      }
    ]);
    setMessageCount(0);
    setCurrentSeverity(null);
    setIsEmergency(false);
    showToast('New consultation started');
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    const count = messageCount + 1;
    setMessageCount(count);

    const newUserMsg = {
      id: Date.now().toString(),
      type: 'user',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      text: text
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      let data;
      // Try real backend API first, fallback to mock
      if (api.getToken()) {
        try {
          const res = await api.triage(text, { locale: currentLang });
          const r = res.data;
          const localizedStrings = {
            en: { seekHelpHigh: "Go to the hospital immediately.", seekHelpLow: "Consult a doctor if symptoms persist.", disclaimer: "This is not a medical diagnosis. Please consult a qualified doctor." },
            hi: { seekHelpHigh: "तुरंत अस्पताल जाएं।", seekHelpLow: "यदि लक्षण बने रहें तो डॉक्टर से परामर्श लें।", disclaimer: "यह चिकित्सा निदान नहीं है। कृपया योग्य डॉक्टर से परामर्श लें।" },
            bn: { seekHelpHigh: "এখনই হাসপাতালে যান।", seekHelpLow: "লক্ষণ অব্যাহত থাকলে ডাক্তারের পরামর্শ নিন।", disclaimer: "এটি চিকিৎসা নির্ণয় নয়। দয়া করে একজন যোগ্য ডাক্তারের পরামর্শ নিন।" },
            ta: { seekHelpHigh: "உடனடியாக மருத்துவமனைக்கு செல்லுங்கள்.", seekHelpLow: "அறிகுறிகள் தொடர்ந்தால் மருத்துவரை அணுகுங்கள்.", disclaimer: "இது மருத்துவ நோயறிதல் அல்ல. தகுதியான மருத்துவரிடம் ஆலோசிக்கவும்." },
            te: { seekHelpHigh: "వెంటనే ఆసుపత్రికి వెళ్ళండి.", seekHelpLow: "లక్షణాలు కొనసాగితే వైద్యుడిని సంప్రదించండి.", disclaimer: "ఇది వైద్య నిర్ధారణ కాదు. దయచేసి అర్హత గల వైద్యుడిని సంప్రదించండి." },
            mr: { seekHelpHigh: "तात्काळ रुग्णालयात जा.", seekHelpLow: "लक्षणे कायम राहिल्यास डॉक्टरांचा सल्ला घ्या.", disclaimer: "हे वैद्यकीय निदान नाही. कृपया पात्र डॉक्टरांचा सल्ला घ्या." }
          };
          const ls = localizedStrings[currentLang] || localizedStrings.en;
          data = {
            severity: (r.severity || '').toLowerCase() === 'emergency' ? 'high' : (r.severity || '').toLowerCase() === 'urgent' ? 'medium' : 'low',
            emergency: (r.severity || '').toLowerCase() === 'emergency',
            initial_response: r.summary || ls.seekHelpLow,
            advice: r.advice || [],
            precautions: r.redFlags || [],
            when_to_seek_help: (r.severity || '').toLowerCase() === 'emergency' ? ls.seekHelpHigh : ls.seekHelpLow,
            disclaimer: ls.disclaimer
          };
        } catch (apiErr) {
          // If backend fails (e.g. 401), fallback to mock
          data = await mockClaudeAPI(text, currentLang);
        }
      } else {
        data = await mockClaudeAPI(text, currentLang);
      }
      setIsTyping(false);
      processAIResponse(data, text);
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        text: 'I apologize — I encountered an error processing your request. Please try again or call emergency services if this is urgent.'
      }]);
    }
  };

  // Mock API since we can't really call Claude without key
  const mockClaudeAPI = (symptoms, lang) => {
    // Symptom category detection (multi-language keywords)
    const text = symptoms.toLowerCase();
    const categories = {
      fever: /fever|temperature|बुखार|ताप|জ্বর|তাপমাত্রা|காய்ச்சல்|జ్వరం|ताप/i.test(text),
      headache: /headache|head pain|migraine|सिरदर्द|सिर.?दर्द|মাথাব্যথা|মাথা.?ব্যথা|தலைவலி|తలనొప్పి|डोकेदुखी/i.test(text),
      stomach: /stomach|abdomen|nausea|vomit|diarr|पेट|उल्टी|दस्त|পেট|বমি|ডায়রিয়া|வயிற்று|வாந்தி|కడుపు|వాంతి|पोट|उलटी/i.test(text),
      chest: /chest|heart|breath|cardiac|छाती|हृदय|दिल|सांस|বুকে|হৃদয়|শ্বাস|நெஞ்சு|இதயம்|மூச்சு|ఛాతీ|గుండె|శ్వాస|छाती|हृदय/i.test(text),
      cold: /cold|cough|sneez|runny nose|sore throat|सर्दी|खांसी|गला|জোলা|সর্দি|কাশি|গলা|சளி|இருமல்|தொண்டை|జలుబు|దగ్గు|గొంతు|सर्दी|खोकला/i.test(text),
      skin: /skin|rash|itch|allergy|त्वचा|खुजली|एलर्जी|ত্বক|চুলকানি|অ্যালার্জি|தோல்|அரிப்பு|ஒவ்வாமை|చర్మం|దురద|అలెర్జీ|त्वचा|खाज/i.test(text),
      pain: /pain|ache|hurt|joint|back|दर्द|जोड़|कमर|ব্যথা|জয়েন্ট|কোমর|வலி|மூட்டு|முதுகு|నొప్పి|కీళ్ళు|నడుము|दुखणे|सांधे|कंबर/i.test(text),
      anxiety: /anxiety|stress|sleep|depression|insomnia|tension|चिंता|तनाव|नींद|उदासी|উদ্বেগ|চাপ|ঘুম|বিষণ্ণতা|பதட்டம்|மன அழுத்தம்|தூக்கம்|ఆందోళన|ఒత్తిడి|నిద్ర|चिंता|ताण|झोप/i.test(text),
      eye: /eye|vision|blur|आंख|नज़र|धुंधला|চোখ|দৃষ্টি|கண்|பார்வை|కన్ను|చూపు|डोळे|दृष्टी/i.test(text),
    };

    // Determine severity
    let severity = 'low';
    let emergency = false;
    if (categories.chest) { severity = 'high'; emergency = true; }
    else if (categories.fever || categories.stomach) { severity = 'medium'; }

    // Symptom-specific responses per language
    const responses = {
      en: {
        fever: { summary: "You appear to have a fever, which is often a sign of infection. Your body is fighting off an illness.", advice: ["Rest in bed and stay hydrated with water, soups, and electrolytes.", "Take paracetamol (500mg) or ibuprofen to reduce fever.", "Sponge your body with lukewarm water if temperature is very high.", "Avoid heavy clothing — wear light, breathable fabrics."], redFlags: ["Fever above 39.5°C (103°F) lasting more than 24 hours", "Severe headache with neck stiffness", "Confusion or difficulty staying awake", "Rash that doesn't fade when pressed"] },
        headache: { summary: "You are experiencing headache symptoms. This could be due to tension, dehydration, eye strain, or other causes.", advice: ["Rest in a quiet, dark room.", "Stay hydrated — drink at least 2-3 liters of water today.", "Take paracetamol or ibuprofen for pain relief.", "Apply a cold compress to your forehead for 15 minutes."], redFlags: ["Sudden severe headache ('thunderclap')", "Headache with fever and stiff neck", "Vision changes or slurred speech", "Headache after a head injury"] },
        stomach: { summary: "You have digestive symptoms which may indicate gastritis, food poisoning, or a stomach infection.", advice: ["Avoid solid food for a few hours — sip clear fluids.", "Try the BRAT diet (bananas, rice, applesauce, toast) when eating.", "Take ORS (oral rehydration solution) to prevent dehydration.", "Avoid spicy, fried, or dairy foods until recovered."], redFlags: ["Blood in vomit or stool", "Severe abdominal pain that doesn't improve", "Unable to keep any fluids down for 12+ hours", "Signs of dehydration (dry mouth, no urination)"] },
        chest: { summary: "You are reporting chest-related symptoms. This requires immediate attention as it could indicate a cardiac or respiratory emergency.", advice: ["Stop all physical activity immediately and sit down.", "If you have aspirin (not allergic), chew one 325mg tablet.", "Call emergency services (108/112) right away.", "Do not drive yourself to the hospital."], redFlags: ["Crushing chest pain radiating to arm or jaw", "Severe shortness of breath at rest", "Loss of consciousness or fainting", "Lips or fingernails turning blue"] },
        cold: { summary: "You have symptoms of a common cold or upper respiratory infection. This is usually viral and self-limiting.", advice: ["Rest well and drink warm fluids (soups, herbal tea, warm water with honey).", "Steam inhalation 2-3 times daily for nasal congestion.", "Gargle with warm salt water for sore throat.", "Take antihistamines if you have runny nose/sneezing."], redFlags: ["High fever (above 39°C) lasting more than 3 days", "Difficulty breathing or wheezing", "Thick green/yellow mucus for more than 10 days", "Ear pain or severe sinus pressure"] },
        skin: { summary: "You have skin-related symptoms which could be an allergic reaction, dermatitis, or infection.", advice: ["Avoid scratching the affected area.", "Apply calamine lotion or hydrocortisone cream for itching.", "Take an antihistamine (cetirizine/loratadine) for allergic reactions.", "Keep the area clean and dry."], redFlags: ["Rapid swelling of face, lips, or throat", "Difficulty breathing with skin rash (anaphylaxis)", "Spreading redness with fever (possible infection)", "Blisters covering large body areas"] },
        pain: { summary: "You are experiencing pain symptoms. This could be muscular, joint-related, or from inflammation.", advice: ["Rest the affected area and avoid strain.", "Apply ice for 15-20 minutes every few hours for the first 48 hours.", "Take ibuprofen or paracetamol for pain relief.", "Gentle stretching exercises may help after initial rest."], redFlags: ["Pain after an injury with inability to move the joint", "Sudden severe pain with swelling and redness", "Pain with numbness or tingling in limbs", "Back pain with loss of bladder/bowel control"] },
        anxiety: { summary: "You are experiencing stress or anxiety-related symptoms. Mental health is just as important as physical health.", advice: ["Practice deep breathing: inhale 4 seconds, hold 4, exhale 6.", "Take a break from screens and stressful environments.", "Light exercise like walking for 20-30 minutes can help.", "Maintain a regular sleep schedule — avoid caffeine after 2 PM."], redFlags: ["Thoughts of self-harm or harming others", "Panic attacks lasting more than 20 minutes", "Unable to perform daily activities for more than 2 weeks", "Dependence on alcohol or substances to cope"] },
        eye: { summary: "You have eye-related symptoms. This could be due to strain, infection, or other conditions.", advice: ["Follow the 20-20-20 rule: every 20 min, look 20 feet away for 20 sec.", "Avoid rubbing your eyes.", "Use lubricating eye drops if feeling dry.", "Reduce screen time and ensure proper lighting."], redFlags: ["Sudden vision loss in one or both eyes", "Eye pain with redness and sensitivity to light", "Seeing flashes of light or floating spots suddenly", "Eye injury with visible damage"] },
        default: { summary: "I've noted your symptoms. Based on what you've described, here is general health guidance.", advice: ["Rest adequately and maintain good hydration.", "Monitor your symptoms and note any changes.", "Maintain a balanced diet and avoid overexertion.", "If symptoms persist for more than 3 days, consult a doctor."], redFlags: ["Symptoms worsening rapidly", "High fever above 39°C", "Difficulty breathing", "Severe pain not relieved by rest"] }
      },
      hi: {
        fever: { summary: "आपको बुखार है, जो अक्सर संक्रमण का संकेत होता है। आपका शरीर किसी बीमारी से लड़ रहा है।", advice: ["बिस्तर पर आराम करें और पानी, सूप और इलेक्ट्रोलाइट्स से हाइड्रेटेड रहें।", "बुखार कम करने के लिए पैरासिटामोल (500mg) लें।", "अगर तापमान बहुत अधिक है तो गुनगुने पानी से शरीर पोंछें।", "हल्के, ढीले कपड़े पहनें।"], redFlags: ["24 घंटे से अधिक 39.5°C (103°F) से ऊपर बुखार", "गर्दन में अकड़न के साथ तेज सिरदर्द", "भ्रम या जागते रहने में कठिनाई", "दाने जो दबाने पर भी न मिटें"] },
        headache: { summary: "आपको सिरदर्द है। यह तनाव, डिहाइड्रेशन, आंखों पर ज़ोर, या अन्य कारणों से हो सकता है।", advice: ["शांत, अंधेरे कमरे में आराम करें।", "आज कम से कम 2-3 लीटर पानी पिएं।", "दर्द के लिए पैरासिटामोल या इबुप्रोफेन लें।", "15 मिनट के लिए माथे पर ठंडी सिकाई करें।"], redFlags: ["अचानक तेज सिरदर्द ('थंडरक्लैप')", "बुखार और गर्दन में अकड़न के साथ सिरदर्द", "दृष्टि में बदलाव या बोलने में कठिनाई", "सिर पर चोट के बाद सिरदर्द"] },
        stomach: { summary: "आपको पाचन संबंधी लक्षण हैं जो गैस्ट्राइटिस, फूड पॉइज़निंग, या पेट के संक्रमण का संकेत हो सकते हैं।", advice: ["कुछ घंटों तक ठोस भोजन से बचें — साफ तरल पदार्थ पिएं।", "ORS (ओरल रिहाइड्रेशन सॉल्ट) लें।", "खिचड़ी, केला, या टोस्ट जैसा हल्का भोजन करें।", "मसालेदार, तला हुआ, या डेयरी खाने से बचें।"], redFlags: ["उल्टी या मल में खून", "पेट में तेज दर्द जो कम न हो", "12+ घंटे तक कोई भी तरल न रख पाना", "डिहाइड्रेशन के संकेत (सूखा मुंह, पेशाब न आना)"] },
        chest: { summary: "आप छाती से संबंधित लक्षण बता रहे हैं। यह तुरंत ध्यान देने योग्य है क्योंकि यह हृदय या श्वसन आपातकाल हो सकता है।", advice: ["तुरंत सभी शारीरिक गतिविधि बंद करें और बैठ जाएं।", "अगर एस्पिरिन है (एलर्जी नहीं), तो एक 325mg टैबलेट चबाएं।", "तुरंत इमरजेंसी सेवा (108/112) को कॉल करें।", "खुद गाड़ी चलाकर अस्पताल न जाएं।"], redFlags: ["छाती में कुचलने जैसा दर्द जो बांह या जबड़े तक जाए", "आराम करते समय भी तेज सांस फूलना", "बेहोशी या चक्कर आना", "होंठ या नाखून नीले पड़ना"] },
        cold: { summary: "आपको सामान्य सर्दी या ऊपरी श्वसन संक्रमण के लक्षण हैं। यह आमतौर पर वायरल होता है।", advice: ["आराम करें और गर्म तरल पदार्थ पिएं (सूप, हर्बल चाय, शहद वाला गर्म पानी)।", "नाक बंद होने पर दिन में 2-3 बार भाप लें।", "गले में खराश के लिए गर्म नमक के पानी से गरारे करें।", "छींक/बहती नाक के लिए एंटीहिस्टामाइन लें।"], redFlags: ["3 दिनों से अधिक तेज बुखार (39°C से ऊपर)", "सांस लेने में कठिनाई या घरघराहट", "10 दिनों से अधिक गाढ़ा हरा/पीला बलगम", "कान में दर्द या तेज साइनस दबाव"] },
        default: { summary: "मैंने आपके लक्षण नोट कर लिए हैं। आपके विवरण के आधार पर, यहाँ सामान्य स्वास्थ्य मार्गदर्शन है।", advice: ["पर्याप्त आराम करें और अच्छी तरह हाइड्रेटेड रहें।", "अपने लक्षणों पर नज़र रखें और कोई बदलाव नोट करें।", "संतुलित आहार लें और अधिक परिश्रम से बचें।", "अगर 3 दिनों से अधिक लक्षण बने रहें तो डॉक्टर से मिलें।"], redFlags: ["लक्षण तेजी से बिगड़ना", "39°C से ऊपर तेज बुखार", "सांस लेने में कठिनाई", "आराम से भी न ठीक होने वाला तेज दर्द"] }
      },
      bn: {
        fever: { summary: "আপনার জ্বর আছে, যা সাধারণত সংক্রমণের লক্ষণ। আপনার শরীর রোগের সাথে লড়ছে।", advice: ["বিশ্রাম নিন এবং পানি, স্যুপ ও ইলেক্ট্রোলাইট দিয়ে হাইড্রেটেড থাকুন।", "জ্বর কমাতে প্যারাসিটামল (৫০০মিগ্রা) নিন।", "তাপমাত্রা বেশি হলে কুসুম গরম পানি দিয়ে শরীর মুছুন।", "হালকা ঢিলেঢালা কাপড় পরুন।"], redFlags: ["২৪ ঘণ্টার বেশি ৩৯.৫°সে এর উপরে জ্বর", "ঘাড় শক্ত হওয়ার সাথে তীব্র মাথাব্যথা", "বিভ্রান্তি বা জেগে থাকতে কষ্ট", "চাপ দিলেও মিলিয়ে যায় না এমন ফুসকুড়ি"] },
        default: { summary: "আমি আপনার লক্ষণগুলো নোট করেছি। আপনার বর্ণনার ভিত্তিতে, এখানে সাধারণ স্বাস্থ্য নির্দেশনা।", advice: ["পর্যাপ্ত বিশ্রাম নিন এবং ভালোভাবে হাইড্রেটেড থাকুন।", "আপনার লক্ষণগুলো পর্যবেক্ষণ করুন।", "সুষম খাদ্য খান এবং অতিরিক্ত পরিশ্রম এড়িয়ে চলুন।", "৩ দিনের বেশি লক্ষণ থাকলে ডাক্তার দেখান।"], redFlags: ["লক্ষণ দ্রুত খারাপ হওয়া", "৩৯°সে এর উপরে জ্বর", "শ্বাসকষ্ট", "বিশ্রামেও ভালো না হওয়া তীব্র ব্যথা"] }
      },
      ta: {
        fever: { summary: "உங்களுக்கு காய்ச்சல் உள்ளது, இது பொதுவாக நோய்த்தொற்றின் அறிகுறி. உங்கள் உடல் நோயை எதிர்த்துப் போராடுகிறது.", advice: ["படுக்கையில் ஓய்வு எடுங்கள், நீர், சூப் மற்றும் எலக்ட்ரோலைட்கள் குடியுங்கள்.", "காய்ச்சலைக் குறைக்க பாராசிட்டமால் (500மிகி) எடுங்கள்.", "வெப்பநிலை மிக அதிகமாக இருந்தால் வெதுவெதுப்பான நீரில் உடலைத் துடையுங்கள்.", "இலகுவான ஆடைகள் அணியுங்கள்."], redFlags: ["24 மணி நேரத்திற்கு மேல் 39.5°C க்கு மேல் காய்ச்சல்", "கழுத்து விறைப்புடன் கடுமையான தலைவலி", "குழப்பம் அல்லது விழிப்புடன் இருக்க கஷ்டம்", "அழுத்தினாலும் மறையாத தடிப்புகள்"] },
        default: { summary: "உங்கள் அறிகுறிகளை நான் குறிப்பிட்டுள்ளேன். உங்கள் விவரிப்பின் அடிப்படையில், பொதுவான சுகாதார வழிகாட்டுதல்.", advice: ["போதுமான ஓய்வு எடுங்கள், நன்கு நீரேற்றமாக இருங்கள்.", "உங்கள் அறிகுறிகளைக் கவனியுங்கள்.", "சமச்சீரான உணவு உண்ணுங்கள்.", "3 நாட்களுக்கு மேல் அறிகுறிகள் தொடர்ந்தால் மருத்துவரை அணுகுங்கள்."], redFlags: ["அறிகுறிகள் வேகமாக மோசமடைதல்", "39°C க்கு மேல் காய்ச்சல்", "மூச்சுத்திணறல்", "ஓய்வில் கூட குறையாத கடுமையான வலி"] }
      },
      te: {
        fever: { summary: "మీకు జ్వరం ఉంది, ఇది సాధారణంగా సంక్రమణ సంకేతం. మీ శరీరం వ్యాధితో పోరాడుతోంది.", advice: ["మంచంలో విశ్రాంతి తీసుకోండి, నీరు, సూప్ మరియు ఎలక్ట్రోలైట్లతో హైడ్రేటెడ్‌గా ఉండండి.", "జ్వరం తగ్గించడానికి పారాసిటమాల్ (500mg) తీసుకోండి.", "ఉష్ణోగ్రత చాలా ఎక్కువగా ఉంటే గోరువెచ్చని నీటితో శరీరాన్ని తుడవండి.", "తేలికైన వదులైన బట్టలు ధరించండి."], redFlags: ["24 గంటలకు పైగా 39.5°C పైన జ్వరం", "మెడ బిగుతుతో తీవ్ర తలనొప్పి", "గందరగోళం లేదా మెలకువగా ఉండలేకపోవడం", "నొక్కినా మాయం కాని దద్దుర్లు"] },
        default: { summary: "మీ లక్షణాలను నేను గమనించాను. మీ వివరణ ఆధారంగా, సాధారణ ఆరోగ్య మార్గదర్శకత్వం ఇక్కడ ఉంది.", advice: ["తగినంత విశ్రాంతి తీసుకోండి, బాగా హైడ్రేటెడ్‌గా ఉండండి.", "మీ లక్షణాలను గమనించండి.", "సమతుల్య ఆహారం తీసుకోండి.", "3 రోజులకు పైగా లక్షణాలు కొనసాగితే వైద్యుడిని సంప్రదించండి."], redFlags: ["లక్షణాలు వేగంగా మరింత తీవ్రమవడం", "39°C పైన జ్వరం", "శ్వాస ఆడకపోవడం", "విశ్రాంతిలోనూ తగ్గని తీవ్ర నొప్పి"] }
      },
      mr: {
        fever: { summary: "तुम्हाला ताप आहे, जो सहसा संसर्गाचे लक्षण असते. तुमचे शरीर आजाराशी लढत आहे.", advice: ["अंथरुणावर विश्रांती घ्या आणि पाणी, सूप आणि इलेक्ट्रोलाइट्स प्या.", "ताप कमी करण्यासाठी पॅरासिटामॉल (500mg) घ्या.", "तापमान खूप जास्त असल्यास कोमट पाण्याने अंग पुसा.", "हलके, सैल कपडे घाला."], redFlags: ["24 तासांपेक्षा जास्त 39.5°से वर ताप", "मानेचा कडकपणा सोबत तीव्र डोकेदुखी", "गोंधळ किंवा जागे राहण्यात अडचण", "दाबूनही जात नाही असे पुरळ"] },
        default: { summary: "मी तुमची लक्षणे नोंदवली आहेत. तुमच्या वर्णनावरून, येथे सामान्य आरोग्य मार्गदर्शन आहे.", advice: ["पुरेशी विश्रांती घ्या आणि चांगले हायड्रेटेड राहा.", "तुमच्या लक्षणांवर लक्ष ठेवा.", "संतुलित आहार घ्या आणि जास्त श्रम टाळा.", "3 दिवसांपेक्षा जास्त लक्षणे राहिल्यास डॉक्टरांना भेटा."], redFlags: ["लक्षणे वेगाने बिघडणे", "39°से वर ताप", "श्वास घेण्यात अडचण", "विश्रांतीनेही कमी न होणारी तीव्र वेदना"] }
      }
    };

    return new Promise(resolve => {
      setTimeout(() => {
        let severity = 'low';
        let emergency = false;
        if (categories.chest) { severity = 'high'; emergency = true; }
        else if (categories.fever || categories.stomach) { severity = 'medium'; }

        // Pick the best matching category for the response
        const langData = responses[lang] || responses.en;
        let matched = null;
        if (categories.chest) matched = langData.chest || responses.en.chest;
        else if (categories.fever) matched = langData.fever || responses.en.fever;
        else if (categories.headache) matched = langData.headache || responses.en.headache;
        else if (categories.stomach) matched = langData.stomach || responses.en.stomach;
        else if (categories.cold) matched = langData.cold || responses.en.cold;
        else if (categories.skin) matched = langData.skin || responses.en.skin;
        else if (categories.pain) matched = langData.pain || responses.en.pain;
        else if (categories.anxiety) matched = langData.anxiety || responses.en.anxiety;
        else if (categories.eye) matched = langData.eye || responses.en.eye;
        else matched = langData.default || responses.en.default;

        const seekHelp = {
          en: { high: "Call emergency services (108/112) or go to the nearest hospital immediately.", low: "Consult a doctor if symptoms persist beyond 3 days or worsen." },
          hi: { high: "तुरंत आपातकालीन सेवा (108/112) को कॉल करें या निकटतम अस्पताल जाएं।", low: "अगर लक्षण 3 दिनों से अधिक बने रहें या बिगड़ें तो डॉक्टर से मिलें।" },
          bn: { high: "এখনই জরুরি সেবা (108/112) কল করুন বা নিকটস্থ হাসপাতালে যান।", low: "৩ দিনের বেশি লক্ষণ থাকলে বা খারাপ হলে ডাক্তার দেখান।" },
          ta: { high: "உடனடியாக அவசர சேவை (108/112) அழைக்கவும் அல்லது அருகிலுள்ள மருத்துவமனைக்கு செல்லவும்.", low: "அறிகுறிகள் 3 நாட்களுக்கு மேல் தொடர்ந்தால் மருத்துவரை அணுகுங்கள்." },
          te: { high: "వెంటనే ఎమర్జెన్సీ సేవలు (108/112) కాల్ చేయండి లేదా సమీప ఆసుపత్రికి వెళ్ళండి.", low: "3 రోజులకు పైగా లక్షణాలు కొనసాగితే వైద్యుడిని సంప్రదించండి." },
          mr: { high: "तात्काळ आपत्कालीन सेवा (108/112) ला कॉल करा किंवा जवळच्या रुग्णालयात जा.", low: "लक्षणे 3 दिवसांपेक्षा जास्त राहिल्यास किंवा बिघडल्यास डॉक्टरांना भेटा." }
        };
        const disclaimer = {
          en: "This is not a medical diagnosis. Please consult a qualified healthcare professional.",
          hi: "यह चिकित्सा निदान नहीं है। कृपया योग्य चिकित्सक से परामर्श लें।",
          bn: "এটি চিকিৎসা নির্ণয় নয়। দয়া করে যোগ্য চিকিৎসকের পরামর্শ নিন।",
          ta: "இது மருத்துவ நோயறிதல் அல்ல. தகுதியான மருத்துவரிடம் ஆலோசிக்கவும்.",
          te: "ఇది వైద్య నిర్ధారణ కాదు. దయచేసి అర్హత గల వైద్యుడిని సంప్రదించండి.",
          mr: "हे वैद्यकीय निदान नाही. कृपया पात्र वैद्यकीय व्यावसायिकांचा सल्ला घ्या."
        };

        resolve({
          severity,
          emergency,
          initial_response: matched.summary,
          advice: matched.advice,
          precautions: matched.redFlags,
          when_to_seek_help: (seekHelp[lang] || seekHelp.en)[severity === 'high' ? 'high' : 'low'],
          disclaimer: disclaimer[lang] || disclaimer.en
        });
      }, 1500);
    });
  };

  const processAIResponse = (data, originalSymptoms) => {
    setCurrentSeverity(data.severity);
    setIsEmergency(data.emergency);

    if (data.emergency) {
      setActiveTab('map');
      setMessages(prev => [...prev, {
        id: Date.now() + '_alert',
        type: 'emergency',
        content: (
          <div className="emergency-alert fade-in">
            <div className="emergency-icon">🚨</div>
            <div className="emergency-text">
              <h4>Emergency Detected</h4>
              <p>Your symptoms may require immediate medical attention. Please call emergency services or go to the nearest hospital immediately.</p>
              <button className="emergency-btn" onClick={() => showToast('Emergency: Calling 108...')}>Call 108 — Emergency</button>
            </div>
          </div>
        )
      }]);
    }

    const aiMsg = {
      id: Date.now().toString(),
      type: 'ai_card',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      data: data
    };

    setMessages(prev => [...prev, aiMsg]);

    if (data.severity === 'high') {
      setActiveTab('map');
    }

    setSidebarHistory(prev => [
      { id: Date.now(), title: originalSymptoms.substring(0, 30) + '...', time: 'Just now', severity: data.severity, active: true },
      ...prev.map(h => ({...h, active: false}))
    ]);
  };

  const toggleVoice = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice input not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    const langCodes = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN' };
    recognition.lang = langCodes[currentLang] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInputText(transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => { showToast('Voice recognition error. Try again.'); setIsRecording(false); };
    recognition.start();
    setIsRecording(true);
    showToast('Listening... speak now');
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const getSeverityColor = (sev) => {
    if (sev === 'low') return 'var(--secondary)';
    if (sev === 'medium') return 'var(--warning)';
    if (sev === 'high') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  const getSeverityLabel = (sev) => {
    if (sev === 'low') return 'Low Risk';
    if (sev === 'medium') return 'Medium Risk';
    if (sev === 'high') return 'High Risk';
    return '—';
  };

  return (
    <div className="page active" id="page-chat">
      <div className="chat-layout">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Consultations</div>
            <button className="new-chat-btn" onClick={newChat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New Consultation
            </button>
          </div>
          <div className="lang-selector">
            <div className="lang-label">Language</div>
            <div className="lang-grid">
              {['en', 'hi', 'bn', 'ta', 'te', 'mr'].map(lang => (
                <button 
                  key={lang} 
                  className={`lang-btn ${currentLang === lang ? 'active' : ''}`}
                  onClick={() => { setCurrentLang(lang); showToast('Language changed'); }}
                >
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : lang === 'bn' ? 'বাংলা' : lang === 'ta' ? 'தமிழ்' : lang === 'te' ? 'తెలుగు' : 'मराठी'}
                </button>
              ))}
            </div>
          </div>
          <div className="history-list">
            {sidebarHistory.map((h, i) => (
              <div key={i} className={`history-item ${h.active ? 'active' : ''}`}>
                <div className="history-item-title">{h.title}</div>
                <div className="history-item-meta">
                  <span>{h.time}</span>
                  <span className={`severity-dot ${h.severity}`}></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-bg-layer"></div>
          <div className="chat-hologram-particles">
            <div className="chat-dna-particle" style={{top: '20%', left: '30%', animationDelay: '0s'}}></div>
            <div className="chat-dna-particle" style={{top: '50%', left: '70%', animationDelay: '1s'}}></div>
            <div className="chat-dna-particle" style={{top: '70%', left: '40%', animationDelay: '2s'}}></div>
            <div className="chat-dna-particle" style={{top: '80%', left: '80%', animationDelay: '3s'}}></div>
          </div>
          <svg className="chat-ecg" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M0,50 L200,50 L250,50 L280,20 L320,90 L360,10 L400,60 L450,50 L1000,50" />
          </svg>
          
          <div className="chat-header">
            <div className="chat-header-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div className="chat-header-info">
              <h3>VITALIS AI Assistant</h3>
              <p>{langMap[currentLang]}</p>
            </div>
            <div className="chat-header-status"></div>
          </div>

          <div className="messages-area">
            {messages.map((msg, i) => {
              if (msg.type === 'ai') {
                const plainText = typeof msg.text === 'string' ? msg.text : 
                  "Hello! I'm VITALIS AI. I'm here to help you assess your health symptoms and guide you toward appropriate care.";
                return (
                  <div key={msg.id} className="message ai fade-in">
                    <div className="message-bubble">{msg.content || msg.text}</div>
                    <div className="message-actions">
                      <span className="message-time">{msg.time}</span>
                      <button 
                        className={`tts-btn ${speakingId === msg.id ? 'speaking' : ''}`}
                        onClick={() => speakText(plainText, msg.id)}
                        title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingId === msg.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              }
              if (msg.type === 'user') {
                return (
                  <div key={msg.id} className="message user fade-in">
                    <div className="message-bubble">{msg.text}</div>
                    <span className="message-time">{msg.time}</span>
                  </div>
                );
              }
              if (msg.type === 'emergency') {
                return <React.Fragment key={msg.id}>{msg.content}</React.Fragment>;
              }
              if (msg.type === 'ai_card') {
                const { data } = msg;
                return (
                  <div key={msg.id} className="message ai slide-in">
                    <div className="ai-card">
                      <div className="ai-card-section">
                        <p style={{fontSize: '14px', lineHeight: 1.6}}>{data.initial_response}</p>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px'}}>
                        <span className={`severity-badge ${data.severity}`}>
                          {data.severity === 'low' ? '🟢' : data.severity === 'medium' ? '🟡' : '🔴'} {data.severity.toUpperCase()} SEVERITY
                        </span>
                      </div>
                      {(() => {
                        const cardLabels = {
                          en: { advice: 'Advice & Recommendations', precautions: 'Red Flags / Warning Signs', seekHelp: 'When to Seek Medical Help' },
                          hi: { advice: 'सलाह और सिफारिशें', precautions: 'खतरे के संकेत', seekHelp: 'डॉक्टर कब दिखाएं' },
                          bn: { advice: 'পরামর্শ ও সুপারিশ', precautions: 'বিপদ সংকেত', seekHelp: 'কখন ডাক্তার দেখাবেন' },
                          ta: { advice: 'ஆலோசனை மற்றும் பரிந்துரைகள்', precautions: 'ஆபத்து அறிகுறிகள்', seekHelp: 'மருத்துவரை எப்போது பார்க்க வேண்டும்' },
                          te: { advice: 'సలహా మరియు సిఫార్సులు', precautions: 'ప్రమాద సంకేతాలు', seekHelp: 'వైద్యుడిని ఎప్పుడు చూడాలి' },
                          mr: { advice: 'सल्ला आणि शिफारसी', precautions: 'धोक्याची चिन्हे', seekHelp: 'डॉक्टर कधी भेटावे' }
                        };
                        const cl = cardLabels[currentLang] || cardLabels.en;
                        return (<>
                      <div className="ai-card-section">
                        <h4>{cl.advice}</h4>
                        {Array.isArray(data.advice) ? (
                          <ul className="precautions-list">
                            {data.advice.map((a, idx) => <li key={idx}>{a}</li>)}
                          </ul>
                        ) : <p>{data.advice}</p>}
                      </div>
                      <div className="ai-card-section">
                        <h4>{cl.precautions}</h4>
                        <ul className="precautions-list">
                          {(Array.isArray(data.precautions) ? data.precautions : []).map((p, idx) => <li key={idx}>{p}</li>)}
                        </ul>
                      </div>
                      <div className="ai-card-section">
                        <h4>{cl.seekHelp}</h4>
                        <p>{data.when_to_seek_help}</p>
                      </div>
                        </>);
                      })()}
                      <div className="disclaimer">{data.disclaimer}</div>
                    </div>
                    <div className="message-actions">
                      <span className="message-time">{msg.time}</span>
                      <button 
                        className={`tts-btn ${speakingId === msg.id ? 'speaking' : ''}`}
                        onClick={() => {
                          const ttsLabels = {
                            en: { severity: 'Severity', assessment: 'Assessment', advice: 'Advice', precautions: 'Precautions', seekHelp: 'When to seek help' },
                            hi: { severity: 'गंभीरता', assessment: 'मूल्यांकन', advice: 'सलाह', precautions: 'सावधानियाँ', seekHelp: 'डॉक्टर कब दिखाएं' },
                            bn: { severity: 'তীব্রতা', assessment: 'মূল্যায়ন', advice: 'পরামর্শ', precautions: 'সতর্কতা', seekHelp: 'কখন ডাক্তার দেখাবেন' },
                            ta: { severity: 'தீவிரத்தன்மை', assessment: 'மதிப்பீடு', advice: 'ஆலோசனை', precautions: 'முன்னெச்சரிக்கைகள்', seekHelp: 'மருத்துவரை எப்போது பார்க்க வேண்டும்' },
                            te: { severity: 'తీవ్రత', assessment: 'అంచనా', advice: 'సలహా', precautions: 'జాగ్రత్తలు', seekHelp: 'వైద్యుడిని ఎప్పుడు చూడాలి' },
                            mr: { severity: 'तीव्रता', assessment: 'मूल्यांकन', advice: 'सल्ला', precautions: 'खबरदारी', seekHelp: 'डॉक्टर कधी भेटावे' }
                          };
                          const l = ttsLabels[currentLang] || ttsLabels.en;
                          const adviceText = Array.isArray(data.advice) ? data.advice.join('. ') : (data.advice || '');
                          const precautionsText = Array.isArray(data.precautions) ? data.precautions.join('. ') : '';
                          const fullText = `${data.initial_response}. ${l.advice}: ${adviceText}. ${l.precautions}: ${precautionsText}. ${l.seekHelp}: ${data.when_to_seek_help}`;
                          speakText(fullText, msg.id);
                        }}
                        title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingId === msg.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })}
            
            {isTyping && (
              <div className="message ai">
                <div className="typing-indicator">
                  <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="quick-symptoms">
              <div className="quick-label">Quick symptom shortcuts:</div>
              <div className="symptom-chips">
                <span className="symptom-chip" onClick={() => fillInput('I have a headache and fever')}>🤕 Headache + Fever</span>
                <span className="symptom-chip" onClick={() => fillInput('I have chest pain and shortness of breath')}>💔 Chest Pain</span>
                <span className="symptom-chip" onClick={() => fillInput('I have stomach pain and nausea')}>🤢 Stomach Pain</span>
                <span className="symptom-chip" onClick={() => fillInput('I have a rash on my skin')}>🔴 Skin Rash</span>
                <span className="symptom-chip" onClick={() => fillInput('I have difficulty breathing')}>😮💨 Breathing Issues</span>
              </div>
            </div>
            <div className="input-bar">
              <textarea 
                className="msg-input" 
                ref={textareaRef}
                value={inputText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms..." 
                rows="1" 
              />
              <div className="input-btns">
                <button 
                  className={`icon-btn voice ${isRecording ? 'recording' : ''}`} 
                  onClick={toggleVoice} 
                  title="Voice input"
                >
                  {isRecording ? (
                    <div className="voice-wave">
                      <div className="voice-bar"></div><div className="voice-bar"></div><div className="voice-bar"></div><div className="voice-bar"></div><div className="voice-bar"></div>
                    </div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  )}
                </button>
                <button className="icon-btn send" onClick={sendMessage} title="Send">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-tabs">
            <button className={`panel-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Analysis</button>
            <button className={`panel-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Hospitals</button>
          </div>

          <div className="panel-content" style={{display: activeTab === 'info' ? 'block' : 'none'}}>
            <div style={{marginBottom: '16px'}}>
              <div style={{fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '10px'}}>Current Status</div>
              <div style={{textAlign: 'center', padding: '20px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)'}}>
                {currentSeverity ? (
                  <>
                    <div style={{fontSize: '36px', marginBottom: '8px'}}>
                      {currentSeverity === 'low' ? '🟢' : currentSeverity === 'medium' ? '🟡' : '🔴'}
                    </div>
                    <div style={{fontSize: '16px', fontWeight: 700, color: getSeverityColor(currentSeverity)}}>
                      {getSeverityLabel(currentSeverity)}
                    </div>
                    {isEmergency && <div style={{fontSize: '11px', color: 'var(--danger)', marginTop: '4px', fontWeight: 600}}>⚠️ SEEK IMMEDIATE CARE</div>}
                  </>
                ) : (
                  <>
                    <div style={{fontSize: '32px', marginBottom: '8px'}}>🩺</div>
                    <div style={{fontSize: '13px', color: 'var(--text-muted)'}}>Awaiting consultation</div>
                  </>
                )}
              </div>
            </div>
            <div className="vitals-grid">
              <div className="vital-card">
                <div className="vital-label">Session</div>
                <div className="vital-value">{messageCount}</div>
                <div className="vital-unit">messages</div>
              </div>
              <div className="vital-card">
                <div className="vital-label">Severity</div>
                <div className="vital-value" style={{fontSize: '14px', color: getSeverityColor(currentSeverity), fontWeight: 600}}>
                  {getSeverityLabel(currentSeverity)}
                </div>
              </div>
            </div>
            <div style={{fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px'}}>Quick Actions</div>
            <div style={{display: 'grid', gap: '8px'}}>
              <button onClick={() => showPage('history')} style={{background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)'}}>
                📋 View consultation history
              </button>
              <button onClick={() => setActiveTab('map')} style={{background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)'}}>
                🏥 Find nearby hospitals
              </button>
              <button onClick={() => showToast('Emergency: Calling 108...')} style={{background: 'var(--danger-light)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 600}}>
                🚨 Emergency — Call 108
              </button>
            </div>
          </div>

          <div className="panel-content" style={{display: activeTab === 'map' ? 'block' : 'none'}}>
            <HospitalMap showToast={showToast} lang={currentLang} />
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryPage = ({ showToast }) => {
  const [filter, setFilter] = useState('all');
  
  const filtered = filter === 'all' ? historyData : historyData.filter(h => h.severity === filter);

  return (
    <div className="page active" id="page-history">
      <div className="chat-bg-layer"></div>
      <div className="history-page">
        <h1>Consultation History</h1>
        <div className="history-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'low' ? 'active' : ''}`} onClick={() => setFilter('low')}>🟢 Low Risk</button>
          <button className={`filter-btn ${filter === 'medium' ? 'active' : ''}`} onClick={() => setFilter('medium')}>🟡 Medium Risk</button>
          <button className={`filter-btn ${filter === 'high' ? 'active' : ''}`} onClick={() => setFilter('high')}>🔴 High Risk</button>
        </div>
        
        <div className="history-cards">
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><p>No consultations found for this filter.</p></div>
          ) : (
            filtered.map(h => (
              <div key={h.id} className="history-card fade-in" onClick={() => showToast('Opening consultation details...')}>
                <div>
                  <div className="history-card-title">{h.title}</div>
                  <div className="history-card-summary">{h.summary}</div>
                  <div style={{fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.5}}>
                    <strong>AI Advice:</strong> {h.advice}
                  </div>
                  <div className="history-card-meta">{h.date} · {h.time}</div>
                </div>
                <div className="history-card-right">
                  <span className={`severity-badge ${h.severity}`}>
                    {h.severity === 'low' ? '🟢 Low Risk' : h.severity === 'medium' ? '🟡 Medium Risk' : '🔴 High Risk'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); showToast('Downloading report...'); }} style={{background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)'}}>📥 Export</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className="page active" id="page-about">
    <div className="chat-bg-layer"></div>
    <div className="about-page">
      <h1>About VITALIS AI</h1>
      <p className="lead">VITALIS AI is a multilingual, AI-powered healthcare assistant designed to bridge the healthcare gap for 900 million rural and underserved citizens across India and beyond.</p>
      <p style={{color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '15px'}}>We believe that access to quality healthcare guidance should not be limited by geography, language, or economic status. By combining state-of-the-art AI triage with multilingual support and real-time hospital finding, VITALIS AI empowers individuals to make informed health decisions from anywhere.</p>
      <div className="about-grid">
        <div className="about-card">
          <h3>🎯 Our Mission</h3>
          <p>Democratize access to preliminary healthcare guidance through technology — making expert-level triage available to every person regardless of location or language.</p>
        </div>
        <div className="about-card">
          <h3>🔬 How AI Works</h3>
          <p>We use Claude AI with structured medical triage prompts to analyze symptoms, assess severity levels, and generate evidence-based recommendations and precautions.</p>
        </div>
        <div className="about-card">
          <h3>🌍 Multilingual Support</h3>
          <p>Supporting 12 Indian regional languages including Hindi, Bengali, Tamil, Telugu, Kannada, and more — with voice input for those who prefer speaking.</p>
        </div>
        <div className="about-card">
          <h3>🔐 Privacy & Security</h3>
          <p>JWT-based authentication, encrypted data storage on MongoDB Atlas, and strict data handling policies ensure your health data remains private and secure.</p>
        </div>
      </div>
      <div className="tech-stack">
        <h3>Technology Stack</h3>
        <div className="tech-tags">
          {["React + Vite", "Tailwind CSS", "Node.js + Express", "MongoDB Atlas", "Claude AI API", "Google Maps API", "Web Speech API", "JWT Auth", "Bhashini API", "Vercel", "Render", "REST APIs"].map(tech => (
            <span key={tech} className="tech-tag">{tech}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ContactPage = ({ showToast }) => (
  <div className="page active" id="page-contact">
    <div className="chat-bg-layer"></div>
    <div className="contact-page">
      <h1>Contact Us</h1>
      <p>Have questions, feedback, or need support? We're here to help make VITALIS AI better for everyone.</p>
      <div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input type="text" className="form-input" placeholder="Your full name" />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-input" placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select className="form-input">
            <option>General Inquiry</option>
            <option>Technical Support</option>
            <option>Partnership</option>
            <option>Report an Issue</option>
            <option>Feature Request</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-input" placeholder="Tell us how we can help..."></textarea>
        </div>
        <button className="submit-btn" onClick={() => showToast("Message sent! We'll respond within 24 hours.")}>Send Message →</button>
      </div>
      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-icon">📧</div>
          <h4>Email</h4>
          <p>support@vitalis.ai</p>
        </div>
        <div className="contact-card">
          <div className="contact-icon">📞</div>
          <h4>Helpline</h4>
          <p>1800-992345</p>
        </div>
        <div className="contact-card">
          <div className="contact-icon">🚨</div>
          <h4>Emergency</h4>
          <p>Dial 108 or 112</p>
        </div>
      </div>
    </div>
  </div>
);

const AuthPage = ({ setUser, showToast, showPage }) => {
  const [view, setView] = useState('register');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const handleRegister = async () => {
    let errs = {};
    if (!formData.name.trim()) errs.name = true;
    if (!formData.email.includes('@')) errs.email = true;
    if (formData.password.length < 8) errs.password = true;
    if (formData.password !== formData.confirm || formData.confirm.length === 0) errs.confirm = true;
    
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      try {
        const res = await api.register(formData.name, formData.email, formData.password);
        setUser({ name: formData.name, email: formData.email, ...res.data?.user });
        showToast(`Welcome, ${formData.name}!`);
        showPage('account');
      } catch (err) {
        showToast(err.message || 'Registration failed');
      }
    }
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      showToast('Please enter email and password');
      return;
    }
    try {
      const res = await api.login(formData.email, formData.password);
      const tokens = res.data?.tokens;
      const userData = res.data?.user;
      if (tokens?.accessToken) api.setToken(tokens.accessToken);
      setUser(userData || { name: 'User', email: formData.email });
      showToast('Signed in successfully!');
      showPage('account');
    } catch (err) {
      showToast(err.message || 'Login failed');
    }
  };

  return (
    <div className="page active" id="page-auth">
      <div className="chat-bg-layer"></div>
      
      {view === 'register' ? (
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-welcome">
              <h2>Join VITALIS</h2>
              <p>Register securely to save your medical history, get personalized AI triage, and manage your health journey in one place.</p>
            </div>
            <div className="auth-forms-container">
              <div className="auth-form">
                <h2>Create Account</h2>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">Full Name</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input type="text" className="form-input" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  {errors.name && <div className="validation-message show">Please enter your full name.</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email Address</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input type="email" className="form-input" placeholder="you@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  {errors.email && <div className="validation-message show">Please enter a valid email address.</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type={showPassword ? "text" : "password"} className="form-input" placeholder="Create a strong password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                  {errors.password && <div className="validation-message show">Password must be at least 8 characters.</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type={showPassword ? "text" : "password"} className="form-input" placeholder="Confirm your password" value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value})} />
                  </div>
                  {errors.confirm && <div className="validation-message show">Passwords do not match.</div>}
                </div>
                <button className="submit-btn" onClick={handleRegister}>Create Account →</button>
              </div>
              <div className="auth-divider">Or sign up with</div>
              <div className="social-login">
                <button className="social-btn" onClick={() => showToast('Connecting to Google...')}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                  Google
                </button>
                <button className="social-btn" onClick={() => showToast('Connecting to Apple...')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Apple
                </button>
              </div>
              <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8'}}>
                Already have an account? <span style={{color: '#00D9FF', cursor: 'pointer', fontWeight: 600}} onClick={() => setView('login')}>Sign In</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-welcome">
              <h2>Welcome Back</h2>
              <p>Sign in to access your consultation history, pick up where you left off, and manage your personal health records.</p>
            </div>
            <div className="auth-forms-container">
              <div className="auth-form">
                <h2>Sign In</h2>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email Address</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input type="email" className="form-input" placeholder="you@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <label className="form-label">Password</label>
                    <span style={{fontSize: '12px', color: '#00D9FF', cursor: 'pointer', marginBottom: '6px'}} onClick={() => showToast('Reset password link sent.')}>Forgot password?</span>
                  </div>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type={showPassword ? "text" : "password"} className="form-input" placeholder="Enter your password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                </div>
                <button className="submit-btn" onClick={handleLogin}>Sign In →</button>
              </div>
              <div className="auth-divider">Or continue with</div>
              <div className="social-login">
                <button className="social-btn" onClick={() => showToast('Connecting to Google...')}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                  Google
                </button>
                <button className="social-btn" onClick={() => showToast('Connecting to Apple...')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Apple
                </button>
              </div>
              <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8'}}>
                Don't have an account? <span style={{color: '#00D9FF', cursor: 'pointer', fontWeight: 600}} onClick={() => setView('register')}>Sign Up</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AccountPage = ({ user, setUser, showPage, showToast }) => {
  const avatar = user?.name ? user.name.substring(0, 2).toUpperCase() : 'US';
  
  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    showToast('Signed out successfully.');
    showPage('home');
  };

  return (
    <div className="page active" id="page-account">
      <div className="chat-bg-layer"></div>
      <div className="account-page">
        <h1>My Account</h1>
        <div className="account-grid">
          <div className="account-menu">
            <button className="account-menu-item active">👤 Profile Details</button>
            <button className="account-menu-item" onClick={() => showPage('history')}>📋 Medical History</button>
            <button className="account-menu-item">⚙️ Settings</button>
            <button className="account-menu-item" style={{color: 'var(--danger)', marginTop: '24px'}} onClick={handleLogout}>🚪 Sign Out</button>
          </div>
          <div className="account-content">
            <h3>Profile Details</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px'}}>
              <div className="profile-avatar">{avatar}</div>
              <div>
                <div style={{fontSize: '20px', fontWeight: 600, color: 'var(--text)'}}>{user?.name || 'User'}</div>
                <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>{user?.email || 'user@example.com'}</div>
              </div>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" className="form-input" defaultValue="30" />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" defaultValue="Male">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" defaultValue="O+">
                  <option>O+</option>
                  <option>O-</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input type="tel" className="form-input" placeholder="+91 xxxxx xxxxx" />
              </div>
            </div>
            <button className="submit-btn" style={{marginTop: '16px', width: 'auto'}} onClick={() => showToast('Profile updated successfully!')}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [user, setUser] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage showPage={setCurrentPage} />;
      case 'chat': return <ChatPage showPage={setCurrentPage} showToast={showToast} />;
      case 'history': return <HistoryPage showToast={showToast} />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage showToast={showToast} />;
      case 'auth': return <AuthPage setUser={setUser} showPage={setCurrentPage} showToast={showToast} />;
      case 'account': return <AccountPage user={user} setUser={setUser} showPage={setCurrentPage} showToast={showToast} />;
      default: return <HomePage showPage={setCurrentPage} />;
    }
  };

  return (
    <>
      <Navbar currentPage={currentPage} showPage={setCurrentPage} user={user} />
      {renderPage()}
      
      {/* Toast Notification */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>
        {toastMsg}
      </div>
    </>
  );
}