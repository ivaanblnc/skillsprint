-- Created initial seed data for SkillSprint platform

-- Insert sample challenges
INSERT INTO "Challenge" (id, title, description, difficulty, points, "timeLimit", "startDate", "endDate", status, "creatorId", "createdAt", "updatedAt") VALUES
('challenge-1', 'Two Sum Problem', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.', 'EASY', 100, 30, NOW(), NOW() + INTERVAL ''7 days'', 'ACTIVE', 'system-user', NOW(), NOW()),
('challenge-2', 'Valid Parentheses', 'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order.', 'EASY', 120, 25, NOW(), NOW() + INTERVAL ''5 days'', 'ACTIVE', 'system-user', NOW(), NOW()),
('challenge-3', 'Longest Substring Without Repeating Characters', 'Given a string s, find the length of the longest substring without repeating characters.', 'MEDIUM', 200, 45, NOW(), NOW() + INTERVAL ''10 days'', 'ACTIVE', 'system-user', NOW(), NOW());

-- Insert test cases for challenges
INSERT INTO "TestCase" (id, "challengeId", input, "expectedOutput", "isPublic", "createdAt") VALUES
-- Two Sum test cases
('test-1-1', 'challenge-1', '[2,7,11,15], 9', '[0,1]', true, NOW()),
('test-1-2', 'challenge-1', '[3,2,4], 6', '[1,2]', true, NOW()),
('test-1-3', 'challenge-1', '[3,3], 6', '[0,1]', false, NOW()),

-- Valid Parentheses test cases
('test-2-1', 'challenge-2', '()', 'true', true, NOW()),
('test-2-2', 'challenge-2', '()[]{}', 'true', true, NOW()),
('test-2-3', 'challenge-2', '(]', 'false', true, NOW()),
('test-2-4', 'challenge-2', '([)]', 'false', false, NOW()),

-- Longest Substring test cases
('test-3-1', 'challenge-3', 'abcabcbb', '3', true, NOW()),
('test-3-2', 'challenge-3', 'bbbbb', '1', true, NOW()),
('test-3-3', 'challenge-3', 'pwwkew', '3', false, NOW());
