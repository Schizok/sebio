"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Moon, Book, Wand2, Save, Library } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import the Google Generative AI library

interface Story {
  id: number;
  title: string;
  content: string;
  character: string;
  theme: string;
  date: string;
}


const StoryGenerator = () => {
  const [storySettings, setStorySettings] = useState({
    mainCharacter: '',
    age: '',
    theme: 'adventure',
    mood: 'happy'
  });
  
  const [generatedStory, setGeneratedStory] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [storyTitle, setStoryTitle] = useState('');
  


  const themes = [
    'Adventure', 'Fantasy', 'Space', 'Animals', 
    'Friendship', 'Magic', 'Ocean'
  ];

  const moods = [
    'Happy', 'Calm', 'Excited', 'Mysterious', 'Gentle'
  ];

  useEffect(() => {
    const stories = JSON.parse(localStorage.getItem('bedtimeStories') || '[]');
    setSavedStories(stories);
  }, []);

  const generateStoryPrompt = () => {
    return `Create a bedtime story in 500 or less characters for a ${storySettings.age} year old child. 
    The main character is named ${storySettings.mainCharacter}. 
    The story should be ${storySettings.theme} themed and have a ${storySettings.mood} mood. 
    Make it engaging and end with a good moral lesson.`;
  };

  const generateStory = async () => {
    setIsLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      const prompt = generateStoryPrompt();
      const result = await model.generateContent(prompt);
      setGeneratedStory(result.response.text());
      setAudioURL(''); // Reset audio URL when generating a new story
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAudio = async () => {
    const payload = {
      text_prompt: generatedStory,
      tts_provider: "BARK",
      elevenlabs_voice_id: "21m00Tcm4TlvDq8ikWAM", // Adjust this if needed
    };

    try {
      const response = await fetch("https://api.gooey.ai/v2/TextToSpeech?example_id=0pkn43u9", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.GOOEY_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio: ' + response.status);
      }

      const result = await response.json();
      setAudioURL(result.audio_url); // Assuming the API returns an audio URL
    } catch (error) {
      console.error('Error generating audio:', error);
    }
  };

  const saveStory = () => {
    if (!storyTitle || !generatedStory) return;
    
    const newStory = {
      id: Date.now(),
      title: storyTitle,
      content: generatedStory,
      character: storySettings.mainCharacter,
      theme: storySettings.theme,
      date: new Date().toLocaleDateString()
    };

    const updatedStories = [...savedStories, newStory];
    setSavedStories(updatedStories);
    localStorage.setItem('bedtimeStories', JSON.stringify(updatedStories));
    setStoryTitle('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Story Generator Card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Moon className="text-purple-600" />
              Story Creator
              <Book className="text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input 
                inputType="text"
                placeholder="Main Character's Name"
                value={storySettings.mainCharacter}
                onChange={(e) => setStorySettings({
                  ...storySettings,
                  mainCharacter: e.target.value
                })}
              />

              <Input 
                type="number"
                placeholder="Character's Age"
                value={storySettings.age}
                onChange={(e) => setStorySettings({
                  ...storySettings,
                  age: e.target.value
                })}
              />

              <select 
                className="w-full p-2 border rounded-md"
                value={storySettings.theme}
                onChange={(e) => setStorySettings({
                  ...storySettings,
                  theme: e.target.value
                })}
              >
                {themes.map(theme => (
                  <option key={theme} value={theme.toLowerCase()}>
                    {theme}
                  </option>
                ))}
              </select>

              <select 
                className="w-full p-2 border rounded-md"
                value={storySettings.mood}
                onChange={(e) => setStorySettings({
                  ...storySettings,
                  mood: e.target.value
                })}
              >
                {moods.map(mood => (
                  <option key={mood} value={mood.toLowerCase()}>
                    {mood}
                  </option>
                ))}
              </select>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={generateStory}
                disabled={isLoading}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Magical Story'}
              </Button>

              {generatedStory && (
                <div className="mt-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                    onClick={generateAudio}
                  >
                    Generate Audio
                  </Button>

                  {audioURL && (
                    <audio controls className="w-full">
                      <source src={audioURL} type="audio/mpeg" />
                      Your browser does not support the audio tag.
                    </audio>
                  )}

                  <Input 
                    placeholder="Enter story title to save..."
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={saveStory}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Story
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generated Story Card */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="text-purple-600" />
              Your Magical Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedStory && (
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{generatedStory}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Stories Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="text-purple-600" />
            Story Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedStories.map(story => (
              <Card key={story.id} className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Character: {story.character} | Theme: {story.theme}
                  </p>
                  <p className="text-xs text-gray-400">{story.date}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 line-clamp-3">{story.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryGenerator;
