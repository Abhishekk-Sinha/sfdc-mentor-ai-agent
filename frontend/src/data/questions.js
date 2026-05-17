import { dsaTopics, levels, salesforceAdminTopics, salesforceDeveloperTopics, systemDesignTopics, timeComplexityTopics } from './topics';

const choose = (arr, i) => arr[i % arr.length];
const levelFor = i => choose(levels, Math.floor(i / 13));

const dsaProblemTemplates = {
  Arrays: [
    ['Two Sum Variant', 'Given an integer array nums and a target, return the indexes of two numbers whose sum equals target. If multiple answers exist, return the first valid pair. Example: nums=[2,7,11,15], target=9 → [0,1].'],
    ['Best Time to Buy and Sell Stock', 'Given daily prices, find the maximum profit by buying once and selling once later. Example: [7,1,5,3,6,4] → 5.'],
    ['Move Zeroes', 'Move all zeroes to the end while maintaining the relative order of non-zero elements. Do it in-place.'],
    ['Maximum Subarray', 'Find the maximum sum of a contiguous subarray. Example: [-2,1,-3,4,-1,2,1,-5,4] → 6.'],
    ['Rotate Array', 'Rotate an array to the right by k steps. Explain modulo handling when k > n.']
  ],
  Strings: [
    ['Valid Anagram', 'Given two strings s and t, return true if t is an anagram of s. Explain character counting.'],
    ['Longest Common Prefix', 'Find the longest common prefix string among an array of strings.'],
    ['Reverse Words', 'Reverse the order of words in a sentence while removing extra spaces.'],
    ['First Unique Character', 'Return the index of the first non-repeating character in a string, or -1.'],
    ['Valid Palindrome', 'Check if a string is palindrome after removing non-alphanumeric characters and ignoring case.']
  ],
  HashMap: [
    ['Frequency Counter', 'Given an array, return a map of each number and its frequency. Then find the most frequent element.'],
    ['Group Anagrams', 'Group words that are anagrams using a sorted key or frequency key.'],
    ['Subarray Sum Equals K', 'Count subarrays whose sum equals k using prefix sum and hashmap.'],
    ['Contains Duplicate II', 'Check if duplicate values appear within distance k.'],
    ['Employee Department Count', 'Given employee records, group employees by department and count them.']
  ],
  Set: [
    ['Contains Duplicate', 'Return true if any value appears at least twice in an array.'],
    ['Longest Consecutive Sequence', 'Find length of longest consecutive sequence using a set in O(n).'],
    ['Unique Email Addresses', 'Normalize emails and count unique addresses.'],
    ['Intersection of Arrays', 'Return unique intersection between two arrays.'],
    ['Happy Number', 'Detect cycle using a set while replacing number by sum of squares of digits.']
  ],
  'Two Pointers': [
    ['Pair Sum in Sorted Array', 'Given a sorted array and target, find if two values sum to target using left/right pointers.'],
    ['Container With Most Water', 'Find max water area using two pointers and explain why moving smaller height works.'],
    ['Remove Duplicates from Sorted Array', 'Remove duplicates in-place and return the new length.'],
    ['3Sum Base Logic', 'Find unique triplets that sum to zero using sorting + two pointers.'],
    ['Merge Sorted Arrays', 'Merge two sorted arrays efficiently using pointer movement.']
  ],
  'Sliding Window': [
    ['Maximum Sum Subarray of Size K', 'Find maximum sum of any contiguous subarray of size k.'],
    ['Longest Substring Without Repeating Characters', 'Find longest substring without repeating characters using window and map/set.'],
    ['Minimum Size Subarray Sum', 'Find minimal window length whose sum is at least target.'],
    ['Permutation in String', 'Check if s2 contains a permutation of s1 using frequency window.'],
    ['Max Consecutive Ones III', 'Find longest sequence of 1s after flipping at most k zeros.']
  ],
  'Binary Search': [
    ['Classic Binary Search', 'Given sorted array nums and target, return target index or -1.'],
    ['Search Insert Position', 'Return the index if found; otherwise return where it would be inserted.'],
    ['First and Last Position', 'Find first and last occurrence of target in sorted array.'],
    ['Search in Rotated Sorted Array', 'Find target in rotated sorted array using binary decision.'],
    ['Find Minimum in Rotated Array', 'Return minimum element from rotated sorted array.']
  ],
  Sorting: [
    ['Merge Intervals', 'Sort intervals by start and merge overlapping intervals.'],
    ['Sort Colors', 'Sort array containing 0,1,2 using Dutch National Flag approach.'],
    ['Kth Largest Element', 'Find kth largest using sorting or heap and compare complexity.'],
    ['Meeting Rooms', 'Given intervals, decide if a person can attend all meetings.'],
    ['Largest Number', 'Arrange numbers to form the largest possible number.']
  ],
  Stack: [
    ['Valid Parentheses', 'Check if brackets are valid using stack.'],
    ['Min Stack', 'Design a stack supporting push, pop, top, and getMin in O(1).'],
    ['Daily Temperatures', 'For each day, find how many days until a warmer temperature.'],
    ['Next Greater Element', 'Find next greater element using monotonic stack.'],
    ['Evaluate Reverse Polish Notation', 'Evaluate expression tokens using stack.']
  ],
  Queue: [
    ['Implement Queue Using Stacks', 'Design queue operations using two stacks.'],
    ['First Non-Repeating Character Stream', 'Given a stream of characters, output first non-repeating after each insertion.'],
    ['Moving Average from Data Stream', 'Maintain moving average of last size values using queue.'],
    ['Rotten Oranges', 'Use BFS queue to find minutes until all oranges rot.'],
    ['Task Scheduler Queue Logic', 'Schedule tasks with cooldown and explain queue/heap approach.']
  ],
  'Linked List': [
    ['Reverse Linked List', 'Reverse a singly linked list iteratively and recursively.'],
    ['Detect Cycle', 'Detect if linked list has a cycle using slow/fast pointers.'],
    ['Merge Two Sorted Lists', 'Merge two sorted linked lists and return sorted head.'],
    ['Remove Nth Node From End', 'Remove nth node from end using two pointers.'],
    ['Middle of Linked List', 'Return middle node using slow/fast pointer.']
  ],
  Recursion: [
    ['Factorial Recursion', 'Write recursive factorial and explain base case/recursive case.'],
    ['Fibonacci with Memoization', 'Compute nth Fibonacci using recursion and memoization.'],
    ['Reverse String Recursively', 'Reverse a char array/string using recursion.'],
    ['Power Function', 'Implement pow(x,n) using fast exponentiation.'],
    ['Generate Subsets', 'Generate all subsets recursively.']
  ],
  Backtracking: [
    ['Generate Parentheses', 'Generate all combinations of well-formed parentheses for n pairs.'],
    ['Combination Sum', 'Find all unique combinations that sum to target.'],
    ['Permutations', 'Generate all permutations of distinct numbers.'],
    ['N-Queens', 'Place n queens so no two attack each other.'],
    ['Word Search', 'Check if word exists in a grid using DFS backtracking.']
  ],
  Trees: [
    ['Maximum Depth of Binary Tree', 'Find maximum depth of a binary tree using DFS/BFS.'],
    ['Level Order Traversal', 'Return level order traversal using queue.'],
    ['Invert Binary Tree', 'Swap left and right children recursively.'],
    ['Validate Binary Search Tree', 'Check if a tree is a valid BST using min/max bounds.'],
    ['Lowest Common Ancestor', 'Find LCA of two nodes in a binary tree.']
  ],
  BST: [
    ['Search in BST', 'Search a value in binary search tree.'],
    ['Insert into BST', 'Insert a value while preserving BST property.'],
    ['Kth Smallest in BST', 'Find kth smallest using inorder traversal.'],
    ['Delete Node in BST', 'Delete a node and maintain BST structure.'],
    ['Validate BST Range', 'Validate BST using range boundaries.']
  ],
  Heap: [
    ['Top K Frequent Elements', 'Return k most frequent elements using heap or bucket sort.'],
    ['Kth Largest in Stream', 'Maintain kth largest using min heap.'],
    ['Merge K Sorted Lists', 'Merge k linked lists using priority queue.'],
    ['Find Median from Data Stream', 'Use two heaps to maintain median.'],
    ['Last Stone Weight', 'Simulate smashing stones using max heap.']
  ],
  Graphs: [
    ['Number of Islands', 'Count islands in grid using DFS/BFS.'],
    ['Clone Graph', 'Deep clone an undirected graph using map and DFS/BFS.'],
    ['Course Schedule', 'Detect cycle in directed graph using topological sort.'],
    ['Shortest Path in Unweighted Graph', 'Use BFS to find shortest path.'],
    ['Connected Components', 'Count connected components in an undirected graph.']
  ],
  BFS: [
    ['Level Order Traversal', 'Use BFS queue to traverse tree level by level.'],
    ['Shortest Path in Binary Matrix', 'Find shortest clear path using BFS.'],
    ['Word Ladder', 'Find shortest transformation sequence length.'],
    ['Rotten Oranges BFS', 'Calculate minimum minutes to rot all oranges.'],
    ['Nearest Exit in Maze', 'Find nearest exit using BFS.']
  ],
  DFS: [
    ['Path Sum', 'Check if root-to-leaf path sum equals target.'],
    ['Flood Fill', 'Recolor connected component using DFS.'],
    ['All Paths Source to Target', 'List all paths in DAG from source to target.'],
    ['Pacific Atlantic Water Flow', 'Find cells reaching both oceans using DFS.'],
    ['Count Provinces', 'Count connected components in adjacency matrix.']
  ],
  Greedy: [
    ['Assign Cookies', 'Maximize content children using greedy sorting.'],
    ['Jump Game', 'Determine if last index is reachable using farthest reach.'],
    ['Gas Station', 'Find starting gas station to complete circuit.'],
    ['Activity Selection', 'Select maximum non-overlapping intervals.'],
    ['Minimum Arrows to Burst Balloons', 'Greedy by end coordinate.']
  ],
  'Dynamic Programming': [
    ['Climbing Stairs', 'Count ways to climb n stairs with 1 or 2 steps.'],
    ['House Robber', 'Max money without robbing adjacent houses.'],
    ['Coin Change', 'Minimum coins to make amount.'],
    ['Longest Increasing Subsequence', 'Find LIS length using DP/binary search.'],
    ['Longest Common Subsequence', 'Find LCS length between two strings.']
  ],
  Intervals: [
    ['Merge Intervals', 'Merge all overlapping intervals.'],
    ['Insert Interval', 'Insert new interval and merge if needed.'],
    ['Non-overlapping Intervals', 'Remove minimum intervals to eliminate overlaps.'],
    ['Meeting Rooms II', 'Find minimum rooms required for meetings.'],
    ['Employee Free Time', 'Find common free intervals.']
  ],
  'Prefix Sum': [
    ['Running Sum', 'Return running sum of array.'],
    ['Range Sum Query', 'Answer range sum queries using prefix array.'],
    ['Subarray Sum Equals K', 'Count subarrays with sum k using prefix map.'],
    ['Pivot Index', 'Find index where left sum equals right sum.'],
    ['Product Except Self', 'Compute product except self without division.']
  ],
  'Bit Manipulation': [
    ['Single Number', 'Find number appearing once using XOR.'],
    ['Number of 1 Bits', 'Count set bits in integer.'],
    ['Power of Two', 'Check if n is power of two using bit operation.'],
    ['Missing Number', 'Find missing number using XOR or sum.'],
    ['Reverse Bits', 'Reverse bits of a 32-bit integer.']
  ],
  Matrix: [
    ['Set Matrix Zeroes', 'If element is 0, set entire row/column to zero in-place.'],
    ['Spiral Matrix', 'Return all elements in spiral order.'],
    ['Rotate Image', 'Rotate n x n matrix by 90 degrees clockwise in-place.'],
    ['Search 2D Matrix', 'Search target in sorted 2D matrix.'],
    ['Word Search Matrix', 'Find if word exists in grid using DFS.']
  ]
};

function buildDSAQuestions() {
  return dsaTopics.flatMap((topic, topicIndex) => {
    const bank = dsaProblemTemplates[topic] || dsaProblemTemplates.Arrays;
    return Array.from({ length: 50 }, (_, i) => {
      const [name, statement] = bank[i % bank.length];
      const variant = Math.floor(i / bank.length) + 1;
      return {
        id: `dsa-${topicIndex + 1}-${i + 1}`,
        track: 'DSA',
        topic,
        level: levelFor(i),
        platform: i === 0 ? 'LeetCode reference' : 'In-app practice',
        title: `${topic}: ${name} #${variant}`,
        question: `${statement}\n\nInput/Output requirement: write clean code, handle empty input, duplicates, negative values where applicable, and explain dry run. This is an in-app LeetCode-style written question; solve it here without opening external links.`,
        hint: `Pattern: ${topic}. First identify brute force, then optimize. Write edge cases before final code.`,
        answer: `Expected answer: explain brute force, optimized approach, JavaScript or pseudocode solution, dry run, time complexity and space complexity.`,
        starterCode: `function solve(input) {\n  // ${name} - ${topic}\n  // 1. Understand input\n  // 2. Write optimized logic\n  // 3. Return result\n}`,
        timeComplexity: topic.includes('Binary') ? 'O(log n)' : ['HashMap', 'Set', 'Two Pointers', 'Sliding Window', 'Prefix Sum'].includes(topic) ? 'O(n)' : ['Sorting', 'Intervals'].includes(topic) ? 'O(n log n)' : 'Depends on approach; target optimized complexity',
        spaceComplexity: ['Two Pointers', 'Binary Search'].includes(topic) ? 'O(1)' : 'O(n) or recursion stack depending on solution',
        link: i === 0 ? `https://leetcode.com/problemset/?search=${encodeURIComponent(topic)}` : '',
      };
    });
  });
}

function buildSalesforceAdminQuestions() {
  const scenarios = ['new business process', 'data quality issue', 'user access issue', 'automation requirement', 'reporting requirement', 'production support issue', 'UAT feedback', 'security concern', 'deployment readiness', 'business demo'];
  return salesforceAdminTopics.flatMap((topic, topicIndex) => Array.from({ length: 50 }, (_, i) => ({
    id: `admin-${topicIndex + 1}-${i + 1}`,
    track: 'Salesforce Admin',
    topic,
    level: levelFor(i),
    title: `${topic} Admin Scenario ${i + 1}`,
    question: `A client has a ${choose(scenarios, i)} related to ${topic}. How will you analyze, configure, test, secure, and explain the Salesforce solution?`,
    hint: 'Think: requirement → configuration → security → testing → reporting → handover.',
    answer: `Clarify requirement, choose declarative configuration for ${topic}, apply permissions/security, test with sample users, create reports if needed, and document the process for business users.`,
    starterCode: `Requirement:\nConfiguration:\nSecurity:\nTesting:\nReports/Dashboard:\nInterview Explanation:`,
    timeComplexity: 'Not applicable',
    spaceComplexity: 'Not applicable',
    link: '',
  })));
}

function buildSalesforceDeveloperQuestions() {
  const requirements = ['bulk-safe logic', 'secure controller', 'LWC integration', 'REST callout', 'test coverage', 'governor-limit optimization', 'debugging', 'deployment', 'exception handling', 'reusable service layer'];
  return salesforceDeveloperTopics.flatMap((topic, topicIndex) => Array.from({ length: 50 }, (_, i) => ({
    id: `dev-${topicIndex + 1}-${i + 1}`,
    track: 'Salesforce Developer',
    topic,
    level: levelFor(i),
    title: `${topic} Developer Question ${i + 1}`,
    question: `Implement or explain ${topic} for a production requirement involving ${choose(requirements, i)}. Include architecture, security, testing, and deployment points.`,
    hint: 'Use service layer, bulkification, governor limits, CRUD/FLS, tests, and deployment notes.',
    answer: `For ${topic}, design a maintainable solution, avoid SOQL/DML in loops, handle exceptions, enforce security where needed, add test data and asserts, and explain business impact.`,
    starterCode: `public with sharing class ${topic.replace(/[^A-Za-z]/g, '')}Service {\n  public static void execute(){\n    // TODO: bulk-safe ${topic} logic\n  }\n}`,
    timeComplexity: 'Depends on SOQL/DML loops; keep bulk-safe',
    spaceComplexity: 'Depends on collections used',
    link: '',
  })));
}

function buildSystemDesignQuestions() {
  const areas = ['requirements', 'APIs', 'database schema', 'caching', 'queue', 'scaling', 'monitoring', 'security', 'failure handling', 'trade-offs'];
  return systemDesignTopics.flatMap((topic, topicIndex) => Array.from({ length: 50 }, (_, i) => ({
    id: `sys-${topicIndex + 1}-${i + 1}`,
    track: 'System Design',
    topic,
    level: levelFor(i),
    title: `Design ${topic} - Part ${i + 1}`,
    question: `Design ${topic} focusing on ${choose(areas, i)}. Explain functional requirements, non-functional requirements, architecture, APIs, data model, scaling, and trade-offs.`,
    hint: 'Start with requirements, then draw high-level architecture, APIs, DB schema, and bottlenecks.',
    answer: `A strong ${topic} design covers requirements, API contracts, storage, caching, async queue, scale, monitoring, security, and failure recovery.`,
    starterCode: `Functional Requirements:\nNon-Functional Requirements:\nAPIs:\nDatabase Schema:\nArchitecture:\nScaling:\nTrade-offs:`,
    timeComplexity: 'System-level complexity, depends on design',
    spaceComplexity: 'Storage and cache planning required',
    link: '',
  })));
}

function buildTimeComplexityQuestions() {
  return timeComplexityTopics.flatMap((topic, topicIndex) => Array.from({ length: 50 }, (_, i) => ({
    id: `tc-${topicIndex + 1}-${i + 1}`,
    track: 'Time Complexity',
    topic,
    level: levelFor(i),
    title: `${topic} Analysis ${i + 1}`,
    question: `Analyze a ${topic} example. Find Big-O time, space complexity, best/average/worst case, and possible optimization.`,
    hint: 'Count loops, recursive calls, data structure operations, and memory usage.',
    answer: `Explain why the algorithm is O(...). Include loop count, recursion depth, auxiliary space, and optimized alternative if possible.`,
    starterCode: `// Paste code here\n// Step 1: Count operations\n// Step 2: Count memory\n// Step 3: Final Big-O`,
    timeComplexity: 'To be analyzed',
    spaceComplexity: 'To be analyzed',
    link: '',
  })));
}

export const questionBank = [
  ...buildDSAQuestions(),
  ...buildSalesforceAdminQuestions(),
  ...buildSalesforceDeveloperQuestions(),
  ...buildSystemDesignQuestions(),
  ...buildTimeComplexityQuestions(),
];

export const scenarioQuestions = [...salesforceAdminTopics, ...salesforceDeveloperTopics].flatMap((topic, topicIndex) =>
  Array.from({ length: 20 }, (_, i) => ({
    id: `scenario-${topicIndex + 1}-${i + 1}`,
    topic,
    level: choose(levels, i),
    question: `Real Salesforce Scenario ${i + 1}: A business team needs a solution for ${topic}. What questions will you ask, what solution will you design, how will you test it, and how will you explain it in an interview?`,
    answer: `Use this answer structure: business problem → Salesforce solution → data model/security → automation/code → testing → reports → business impact.`,
  }))
);
