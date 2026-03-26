import { useState } from 'react';
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
  Tag,
  Link,
} from '@carbon/react';
import { DocumentBlank, Microphone, Information } from '@carbon/icons-react';
import FileUploader from './components/STT/FileUploader';
import LiveRecorder from './components/STT/LiveRecorder';
import TranscriptionDisplay from './components/STT/TranscriptionDisplay';

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
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Tag type="green">Phase 2: STT Active</Tag>
              <Link href="http://localhost:8000/health" target="_blank" rel="noopener noreferrer">
                Health Check
              </Link>
              <Link href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
                API Docs
              </Link>
            </div>
          </Column>

          <Column lg={16} md={8} sm={4}>
            <Tabs selectedIndex={selectedTab} onChange={(evt) => setSelectedTab(evt.selectedIndex)}>
              <TabList aria-label="Main navigation tabs" contained>
                <Tab>Speech to Text</Tab>
                <Tab disabled>Text to Speech</Tab>
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

                {/* Text to Speech Panel (Disabled) */}
                <TabPanel>
                  <div style={{ padding: '2rem 0' }}>
                    <p>Text to Speech functionality coming soon...</p>
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