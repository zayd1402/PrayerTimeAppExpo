// The weekly self-review (muhasabah): three short questions after Jumu'ah. Private, never
// scored, and skipping it changes nothing. Answers stay on the device.
import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '../design/ui';
import { loadReflections, saveReflection } from '../services/StorageService';
import { Field, GhostButton, Sheet } from './Sheet';

const QUESTIONS = ['What went well this week?', 'Which prayer felt hardest to keep?', 'One small change for next week'];
const PLACEHOLDERS = ['A few words', 'A few words', 'Arrive at the mosque for Isha on Thursday'];

export default function ReflectionSheet({ dateKey, onClose }: { dateKey: string | null; onClose: () => void }) {
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  useEffect(() => {
    if (dateKey) setAnswers(loadReflections()[dateKey] ?? ['', '', '']);
  }, [dateKey]);
  if (!dateKey) return null;
  return (
    <Sheet visible title="This week" subtitle="Private. Only you see this." onClose={onClose}>
      {QUESTIONS.map((q, i) => (
        <Field
          key={q}
          label={q}
          value={answers[i]}
          onChangeText={t => setAnswers(a => a.map((x, j) => (j === i ? t : x)))}
          placeholder={PLACEHOLDERS[i]}
          multiline
          maxLength={280}
        />
      ))}
      <PrimaryButton label="Save reflection" large onPress={() => { saveReflection(dateKey, answers.map(a => a.trim())); onClose(); }} />
      <GhostButton label="Not now" onPress={onClose} />
    </Sheet>
  );
}
