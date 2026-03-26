import { useState, useEffect } from 'react';
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Content,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  Column,
  Link,
  InlineNotification,
} from '@carbon/react';
import { DocumentBlank, Microphone, Information, Checkmark, WarningAlt } from '@carbon/icons-react';
import FileUploader from './components/STT/FileUploader';
import LiveRecorder from './components/STT/LiveRecorder';
import TranscriptionDisplay from './components/STT/TranscriptionDisplay';
import TextInput from './components/TTS/TextInput';
import DocumentUploader from './components/TTS/DocumentUploader';

interface TranscriptionResult {
  id: number;
  text: string;
  language: string;
  confidence?: number;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
  metadata: Record<string, any>;
  provider: string;
  model: string;
  audio_file_path: string;
  created_at: string;
}

function App() {
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        setHealthStatus('healthy');
      } else {
        setHealthStatus('unhealthy');
      }
    } catch (error) {
      setHealthStatus('unhealthy');
    }
  };

  const handleTranscriptionComplete = (result: TranscriptionResult) => {
    setTranscription(result);
  };

  const handleError = (error: string) => {
    console.error('Transcription error:', error);
  };

  return (
    <div className="app-container">
      <Header aria-label="Speech-to-Text & Text-to-Speech Platform">
        <HeaderName href="#" prefix="">
          Speech-to-Text & Text-to-Speech Platform
        </HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label={`Backend Status: ${healthStatus}`}
            tooltipAlignment="end"
            onClick={checkHealth}
          >
            {healthStatus === 'healthy' ? (
              <Checkmark size={20} style={{ color: '#24a148' }} />
            ) : healthStatus === 'unhealthy' ? (
              <WarningAlt size={20} style={{ color: '#da1e28' }} />
            ) : (
              <Information size={20} />
            )}
          </HeaderGlobalAction>
          <HeaderGlobalAction
            aria-label="API Documentation"
            tooltipAlignment="end"
            onClick={() => window.open('http://localhost:8000/docs', '_blank')}
          >
            <Information size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>

      <Content>
        <Grid fullWidth narrow>
          <Column lg={16} md={8} sm={4}>
            <Tabs selectedIndex={selectedTab} onChange={(evt) => setSelectedTab(evt.selectedIndex)}>
              <TabList aria-label="Main navigation tabs" contained>
                <Tab>Speech to Text</Tab>
                <Tab>Text to Speech</Tab>
                <Tab>System Info</Tab>
              </TabList>
              <TabPanels>
                {/* Speech to Text Panel */}
                <TabPanel>
                  <div style={{ marginTop: '2rem' }}>
                    <Tabs>
                      <TabList aria-label="STT input methods">
                        <Tab renderIcon={DocumentBlank}>Upload Audio File</Tab>
                        <Tab renderIcon={Microphone}>Live Recording</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel>
                          <div style={{ padding: '2rem 0' }}>
                            <FileUploader
                              onTranscriptionComplete={handleTranscriptionComplete}
                              onError={handleError}
                            />
                          </div>
                        </TabPanel>
                        <TabPanel>
                          <div style={{ padding: '2rem 0' }}>
                            <LiveRecorder
                              onTranscriptionComplete={handleTranscriptionComplete}
                              onError={handleError}
                            />
                          </div>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>

                    {transcription && (
                      <div style={{ marginTop: '2rem' }}>
                        <TranscriptionDisplay transcription={transcription} />
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Text to Speech Panel */}
                <TabPanel>
                  <div style={{ marginTop: '2rem' }}>
                    <Tabs>
                      <TabList aria-label="TTS input methods">
                        <Tab renderIcon={DocumentBlank}>Text Input</Tab>
                        <Tab renderIcon={DocumentBlank}>Document Upload</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel>
                          <div style={{ padding: '2rem 0' }}>
                            <TextInput />
                          </div>
                        </TabPanel>
                        <TabPanel>
                          <div style={{ padding: '2rem 0' }}>
                            <DocumentUploader />
                          </div>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </div>
                </TabPanel>

                {/* System Info Panel */}
                <TabPanel>
                  <div style={{ marginTop: '2rem', maxWidth: '800px' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
                      System Information
                    </h2>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '500' }}>
                        Backend Status
                      </h3>
                      <InlineNotification
                        kind={healthStatus === 'healthy' ? 'success' : healthStatus === 'unhealthy' ? 'error' : 'info'}
                        title={
                          healthStatus === 'healthy'
                            ? 'Backend is healthy'
                            : healthStatus === 'unhealthy'
                            ? 'Backend is not responding'
                            : 'Checking backend status...'
                        }
                        subtitle={
                          healthStatus === 'healthy'
                            ? 'All services are running normally'
                            : healthStatus === 'unhealthy'
                            ? 'Please check if the backend service is running'
                            : 'Please wait...'
                        }
                        hideCloseButton
                        lowContrast
                      />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '500' }}>
                        API Resources
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <Link href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
                            Interactive API Documentation (Swagger UI)
                          </Link>
                          <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#525252' }}>
                            Explore and test all API endpoints
                          </p>
                        </div>
                        <div>
                          <Link href="http://localhost:8000/health" target="_blank" rel="noopener noreferrer">
                            Health Check Endpoint
                          </Link>
                          <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#525252' }}>
                            View detailed health status
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '500' }}>
                        Features
                      </h3>
                      <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.75' }}>
                        <li>Speech-to-Text: Upload audio files or record live</li>
                        <li>Text-to-Speech: Convert text or documents to speech</li>
                        <li>Multiple voices and languages supported</li>
                        <li>Adjustable speech speed (0.25x - 4.0x)</li>
                        <li>Multiple audio formats (MP3, WAV, Opus, FLAC)</li>
                        <li>Document support (TXT, PDF, DOCX)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '500' }}>
                        About
                      </h3>
                      <p style={{ lineHeight: '1.75', color: '#525252' }}>
                        This platform provides speech-to-text and text-to-speech capabilities using OpenAI's
                        Whisper and TTS models. Built with FastAPI (Python) backend and React (TypeScript) frontend.
                      </p>
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Column>
        </Grid>
      </Content>
    </div>
  );
}

export default App;
