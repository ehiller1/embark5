import React, { useState, useEffect } from 'react';
import { VocationalStatementsContainerProps, UIVocationalStatement } from '@/types/NarrativeTypes';

export const VocationalStatementsContainer: React.FC<VocationalStatementsContainerProps> = ({
  generatedStatements = { church: [], community: [], companion: [] }
}) => {
  const [allGeneratedStatements, setAllGeneratedStatements] = useState<UIVocationalStatement[]>([]);

  useEffect(() => {
    if (generatedStatements) {
      const combined = Object.values(generatedStatements).flat();
      setAllGeneratedStatements(combined);
    } else {
      setAllGeneratedStatements([]);
    }
  }, [generatedStatements]);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontSize: 24, marginBottom: 24 }}>Vocational Statements</h2>
      {allGeneratedStatements.length === 0 ? (
        <div>No vocational statements available.</div>
      ) : (
        allGeneratedStatements.map((stmt) => (
          <div
            key={stmt.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              marginBottom: 20,
              padding: 16,
              background: '#fafbfc'
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              {stmt.avatar_role && <span style={{ color: '#6b7280', marginRight: 8 }}>{stmt.avatar_role.toUpperCase()}</span>}
              {stmt.avatar_name && <span style={{ color: '#222' }}>{stmt.avatar_name}</span>}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Mission Statement:</strong> {stmt.mission_statement}
            </div>
            {stmt.contextual_explanation && (
              <div style={{ marginBottom: 8 }}>
                <strong>Contextual Explanation:</strong> {stmt.contextual_explanation}
              </div>
            )}
            {stmt.theological_justification && (
              <div style={{ marginBottom: 8 }}>
                <strong>Theological Justification:</strong> {stmt.theological_justification}
              </div>
            )}
            {stmt.practical_application && (
              <div style={{ marginBottom: 8 }}>
                <strong>Practical Application:</strong> {stmt.practical_application}
              </div>
            )}
            {stmt.content && (
              <div style={{ marginBottom: 8 }}>
                <strong>Content:</strong> {stmt.content}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#888' }}>ID: {stmt.id}</div>
          </div>
        ))
      )}
    </div>
  );
};

