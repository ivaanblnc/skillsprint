-- Sample data for SkillSprint platform

-- Insert sample challenges
INSERT INTO public.challenges (id, title, description, difficulty, category, time_limit, points, starter_code, solution, is_active) VALUES
(
  uuid_generate_v4(),
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  'beginner',
  'Arrays',
  30,
  100,
  'function twoSum(nums, target) {
    // Your code here
}',
  'function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}',
  true
),
(
  uuid_generate_v4(),
  'Palindrome Check',
  'Write a function that checks if a given string is a palindrome (reads the same forwards and backwards).',
  'beginner',
  'Strings',
  20,
  80,
  'function isPalindrome(s) {
    // Your code here
}',
  'function isPalindrome(s) {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned === cleaned.split("").reverse().join("");
}',
  true
),
(
  uuid_generate_v4(),
  'Binary Tree Traversal',
  'Implement in-order traversal of a binary tree and return the values in an array.',
  'intermediate',
  'Trees',
  45,
  200,
  'function inorderTraversal(root) {
    // Your code here
}',
  'function inorderTraversal(root) {
    const result = [];
    function traverse(node) {
        if (node) {
            traverse(node.left);
            result.push(node.val);
            traverse(node.right);
        }
    }
    traverse(root);
    return result;
}',
  true
),
(
  uuid_generate_v4(),
  'Merge Intervals',
  'Given an array of intervals, merge all overlapping intervals and return an array of non-overlapping intervals.',
  'advanced',
  'Arrays',
  60,
  300,
  'function merge(intervals) {
    // Your code here
}',
  'function merge(intervals) {
    if (intervals.length <= 1) return intervals;
    intervals.sort((a, b) => a[0] - b[0]);
    const result = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const current = intervals[i];
        const last = result[result.length - 1];
        if (current[0] <= last[1]) {
            last[1] = Math.max(last[1], current[1]);
        } else {
            result.push(current);
        }
    }
    return result;
}',
  true
);

-- Insert test cases for the challenges
-- Two Sum test cases
INSERT INTO public.test_cases (challenge_id, input, expected_output, is_hidden) 
SELECT id, '[2,7,11,15], 9', '[0,1]', false FROM public.challenges WHERE title = 'Two Sum'
UNION ALL
SELECT id, '[3,2,4], 6', '[1,2]', false FROM public.challenges WHERE title = 'Two Sum'
UNION ALL
SELECT id, '[3,3], 6', '[0,1]', true FROM public.challenges WHERE title = 'Two Sum';

-- Palindrome Check test cases
INSERT INTO public.test_cases (challenge_id, input, expected_output, is_hidden)
SELECT id, '"racecar"', 'true', false FROM public.challenges WHERE title = 'Palindrome Check'
UNION ALL
SELECT id, '"hello"', 'false', false FROM public.challenges WHERE title = 'Palindrome Check'
UNION ALL
SELECT id, '"A man a plan a canal Panama"', 'true', true FROM public.challenges WHERE title = 'Palindrome Check';

-- Binary Tree Traversal test cases
INSERT INTO public.test_cases (challenge_id, input, expected_output, is_hidden)
SELECT id, '{"val":1,"left":null,"right":{"val":2,"left":{"val":3,"left":null,"right":null},"right":null}}', '[1,3,2]', false FROM public.challenges WHERE title = 'Binary Tree Traversal'
UNION ALL
SELECT id, 'null', '[]', false FROM public.challenges WHERE title = 'Binary Tree Traversal'
UNION ALL
SELECT id, '{"val":1,"left":null,"right":null}', '[1]', true FROM public.challenges WHERE title = 'Binary Tree Traversal';

-- Merge Intervals test cases
INSERT INTO public.test_cases (challenge_id, input, expected_output, is_hidden)
SELECT id, '[[1,3],[2,6],[8,10],[15,18]]', '[[1,6],[8,10],[15,18]]', false FROM public.challenges WHERE title = 'Merge Intervals'
UNION ALL
SELECT id, '[[1,4],[4,5]]', '[[1,5]]', false FROM public.challenges WHERE title = 'Merge Intervals'
UNION ALL
SELECT id, '[[1,4],[0,4]]', '[[0,4]]', true FROM public.challenges WHERE title = 'Merge Intervals';
