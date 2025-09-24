const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // -----------------------
  // Users
  // -----------------------
  const users = [
    {
      id: 'system-user',
      name: 'System User',
      email: 'system@skillsprint.com',
      role: 'CREATOR',
    },
    {
      id: 'participant-1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'PARTICIPANT',
    },
    {
      id: 'participant-2',
      name: 'Bob',
      email: 'bob@example.com',
      role: 'PARTICIPANT',
    },

  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  // -----------------------
  // Challenges
  // -----------------------
  const challenges = [
    {
      id: 'challenge-1',
      title: 'Two Sum Problem',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
      difficulty: 'EASY',
      points: 100,
      timeLimit: 30,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      creatorId: 'system-user',
    },
    {
      id: 'challenge-2',
      title: 'Valid Parentheses',
      description:
        "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets and in correct order.",
      difficulty: 'EASY',
      points: 120,
      timeLimit: 25,
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      creatorId: 'system-user',
    },
    {
      id: 'challenge-3',
      title: 'Longest Substring Without Repeating Characters',
      description: 'Given a string s, find the length of the longest substring without repeating characters.',
      difficulty: 'MEDIUM',
      points: 200,
      timeLimit: 45,
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      creatorId: 'system-user',
    },
  ];

  for (const c of challenges) {
    await prisma.challenge.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // -----------------------
  // Test Cases
  // -----------------------
  const testCases = [
    { id: 'test-1-1', challengeId: 'challenge-1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isPublic: true },
    { id: 'test-1-2', challengeId: 'challenge-1', input: '[3,2,4], 6', expectedOutput: '[1,2]', isPublic: true },
    { id: 'test-1-3', challengeId: 'challenge-1', input: '[3,3], 6', expectedOutput: '[0,1]', isPublic: false },

    { id: 'test-2-1', challengeId: 'challenge-2', input: '()', expectedOutput: 'true', isPublic: true },
    { id: 'test-2-2', challengeId: 'challenge-2', input: '()[]{}', expectedOutput: 'true', isPublic: true },
    { id: 'test-2-3', challengeId: 'challenge-2', input: '(]', expectedOutput: 'false', isPublic: true },
    { id: 'test-2-4', challengeId: 'challenge-2', input: '([)]', expectedOutput: 'false', isPublic: false },

    { id: 'test-3-1', challengeId: 'challenge-3', input: 'abcabcbb', expectedOutput: '3', isPublic: true },
    { id: 'test-3-2', challengeId: 'challenge-3', input: 'bbbbb', expectedOutput: '1', isPublic: true },
    { id: 'test-3-3', challengeId: 'challenge-3', input: 'pwwkew', expectedOutput: '3', isPublic: false },
  ];

  for (const t of testCases) {
    await prisma.testCase.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  // -----------------------
  // Submissions
  // -----------------------
  const submissions = [
    {
      id: 'submission-1',
      challengeId: 'challenge-1',
      userId: 'participant-1',
      code: 'function twoSum(nums, target) { return [0,1]; }',
      language: 'javascript',
      status: 'ACCEPTED',
      score: 100,
      executionTime: 5,
      memory: 1024,
    },
    {
      id: 'submission-2',
      challengeId: 'challenge-2',
      userId: 'participant-2',
      code: 'function isValid(s) { return true; }',
      language: 'javascript',
      status: 'WRONG_ANSWER',
      score: 0,
      executionTime: 2,
      memory: 512,
    },
  ];

  for (const s of submissions) {
    await prisma.submission.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  // -----------------------
  // Feedbacks
  // -----------------------
  const feedbacks = [
    {
      id: 'feedback-1',
      submissionId: 'submission-1',
      creatorId: 'creator-1',
      comment: 'Excellent solution!',
      rating: 5,
    },
    {
      id: 'feedback-2',
      submissionId: 'submission-2',
      creatorId: 'creator-1',
      comment: 'Needs improvement.',
      rating: 2,
    },
  ];

  for (const f of feedbacks) {
    await prisma.feedback.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
  }

  console.log('Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
