/**
 * The NeetCode 150 roadmap, in study order. Problem slugs double as stable ids
 * and as LeetCode URLs, so progress survives any edit to the titles here.
 */

export type PracticeProblem = {
  /** LeetCode slug — the id used for progress tracking. */
  slug: string;
  title: string;
};

export type PracticePattern = {
  name: string;
  problems: PracticeProblem[];
};

function problem(slug: string, title: string): PracticeProblem {
  return { slug, title };
}

export function problemUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

export const NEETCODE_150: PracticePattern[] = [
  {
    name: 'Arrays & Hashing',
    problems: [
      problem('contains-duplicate', 'Contains Duplicate'),
      problem('valid-anagram', 'Valid Anagram'),
      problem('two-sum', 'Two Sum'),
      problem('group-anagrams', 'Group Anagrams'),
      problem('top-k-frequent-elements', 'Top K Frequent Elements'),
      problem('encode-and-decode-strings', 'Encode and Decode Strings'),
      problem('product-of-array-except-self', 'Product of Array Except Self'),
      problem('valid-sudoku', 'Valid Sudoku'),
      problem('longest-consecutive-sequence', 'Longest Consecutive Sequence'),
    ],
  },
  {
    name: 'Two Pointers',
    problems: [
      problem('valid-palindrome', 'Valid Palindrome'),
      problem('two-sum-ii-input-array-is-sorted', 'Two Sum II'),
      problem('3sum', '3Sum'),
      problem('container-with-most-water', 'Container With Most Water'),
      problem('trapping-rain-water', 'Trapping Rain Water'),
    ],
  },
  {
    name: 'Sliding Window',
    problems: [
      problem('best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock'),
      problem(
        'longest-substring-without-repeating-characters',
        'Longest Substring Without Repeating Characters'
      ),
      problem(
        'longest-repeating-character-replacement',
        'Longest Repeating Character Replacement'
      ),
      problem('permutation-in-string', 'Permutation in String'),
      problem('minimum-window-substring', 'Minimum Window Substring'),
      problem('sliding-window-maximum', 'Sliding Window Maximum'),
    ],
  },
  {
    name: 'Stack',
    problems: [
      problem('valid-parentheses', 'Valid Parentheses'),
      problem('min-stack', 'Min Stack'),
      problem('evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation'),
      problem('generate-parentheses', 'Generate Parentheses'),
      problem('daily-temperatures', 'Daily Temperatures'),
      problem('car-fleet', 'Car Fleet'),
      problem('largest-rectangle-in-histogram', 'Largest Rectangle in Histogram'),
    ],
  },
  {
    name: 'Binary Search',
    problems: [
      problem('binary-search', 'Binary Search'),
      problem('search-a-2d-matrix', 'Search a 2D Matrix'),
      problem('koko-eating-bananas', 'Koko Eating Bananas'),
      problem('find-minimum-in-rotated-sorted-array', 'Find Minimum in Rotated Sorted Array'),
      problem('search-in-rotated-sorted-array', 'Search in Rotated Sorted Array'),
      problem('time-based-key-value-store', 'Time Based Key-Value Store'),
      problem('median-of-two-sorted-arrays', 'Median of Two Sorted Arrays'),
    ],
  },
  {
    name: 'Linked List',
    problems: [
      problem('reverse-linked-list', 'Reverse Linked List'),
      problem('merge-two-sorted-lists', 'Merge Two Sorted Lists'),
      problem('reorder-list', 'Reorder List'),
      problem('remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List'),
      problem('copy-list-with-random-pointer', 'Copy List With Random Pointer'),
      problem('add-two-numbers', 'Add Two Numbers'),
      problem('linked-list-cycle', 'Linked List Cycle'),
      problem('find-the-duplicate-number', 'Find the Duplicate Number'),
      problem('lru-cache', 'LRU Cache'),
      problem('merge-k-sorted-lists', 'Merge K Sorted Lists'),
      problem('reverse-nodes-in-k-group', 'Reverse Nodes in K-Group'),
    ],
  },
  {
    name: 'Trees',
    problems: [
      problem('invert-binary-tree', 'Invert Binary Tree'),
      problem('maximum-depth-of-binary-tree', 'Maximum Depth of Binary Tree'),
      problem('diameter-of-binary-tree', 'Diameter of Binary Tree'),
      problem('balanced-binary-tree', 'Balanced Binary Tree'),
      problem('same-tree', 'Same Tree'),
      problem('subtree-of-another-tree', 'Subtree of Another Tree'),
      problem(
        'lowest-common-ancestor-of-a-binary-search-tree',
        'Lowest Common Ancestor of a BST'
      ),
      problem('binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal'),
      problem('binary-tree-right-side-view', 'Binary Tree Right Side View'),
      problem('count-good-nodes-in-binary-tree', 'Count Good Nodes in Binary Tree'),
      problem('validate-binary-search-tree', 'Validate Binary Search Tree'),
      problem('kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST'),
      problem(
        'construct-binary-tree-from-preorder-and-inorder-traversal',
        'Construct Binary Tree From Preorder and Inorder Traversal'
      ),
      problem('binary-tree-maximum-path-sum', 'Binary Tree Maximum Path Sum'),
      problem(
        'serialize-and-deserialize-binary-tree',
        'Serialize and Deserialize Binary Tree'
      ),
    ],
  },
  {
    name: 'Tries',
    problems: [
      problem('implement-trie-prefix-tree', 'Implement Trie (Prefix Tree)'),
      problem(
        'design-add-and-search-words-data-structure',
        'Design Add and Search Words Data Structure'
      ),
      problem('word-search-ii', 'Word Search II'),
    ],
  },
  {
    name: 'Heap / Priority Queue',
    problems: [
      problem('kth-largest-element-in-a-stream', 'Kth Largest Element in a Stream'),
      problem('last-stone-weight', 'Last Stone Weight'),
      problem('k-closest-points-to-origin', 'K Closest Points to Origin'),
      problem('kth-largest-element-in-an-array', 'Kth Largest Element in an Array'),
      problem('task-scheduler', 'Task Scheduler'),
      problem('design-twitter', 'Design Twitter'),
      problem('find-median-from-data-stream', 'Find Median From Data Stream'),
    ],
  },
  {
    name: 'Backtracking',
    problems: [
      problem('subsets', 'Subsets'),
      problem('combination-sum', 'Combination Sum'),
      problem('permutations', 'Permutations'),
      problem('subsets-ii', 'Subsets II'),
      problem('combination-sum-ii', 'Combination Sum II'),
      problem('word-search', 'Word Search'),
      problem('palindrome-partitioning', 'Palindrome Partitioning'),
      problem('letter-combinations-of-a-phone-number', 'Letter Combinations of a Phone Number'),
      problem('n-queens', 'N-Queens'),
    ],
  },
  {
    name: 'Graphs',
    problems: [
      problem('number-of-islands', 'Number of Islands'),
      problem('clone-graph', 'Clone Graph'),
      problem('max-area-of-island', 'Max Area of Island'),
      problem('pacific-atlantic-water-flow', 'Pacific Atlantic Water Flow'),
      problem('surrounded-regions', 'Surrounded Regions'),
      problem('rotting-oranges', 'Rotting Oranges'),
      problem('walls-and-gates', 'Walls and Gates'),
      problem('course-schedule', 'Course Schedule'),
      problem('course-schedule-ii', 'Course Schedule II'),
      problem('redundant-connection', 'Redundant Connection'),
      problem(
        'number-of-connected-components-in-an-undirected-graph',
        'Number of Connected Components in an Undirected Graph'
      ),
      problem('graph-valid-tree', 'Graph Valid Tree'),
      problem('word-ladder', 'Word Ladder'),
    ],
  },
  {
    name: 'Advanced Graphs',
    problems: [
      problem('reconstruct-itinerary', 'Reconstruct Itinerary'),
      problem('min-cost-to-connect-all-points', 'Min Cost to Connect All Points'),
      problem('network-delay-time', 'Network Delay Time'),
      problem('swim-in-rising-water', 'Swim in Rising Water'),
      problem('alien-dictionary', 'Alien Dictionary'),
      problem('cheapest-flights-within-k-stops', 'Cheapest Flights Within K Stops'),
    ],
  },
  {
    name: '1-D Dynamic Programming',
    problems: [
      problem('climbing-stairs', 'Climbing Stairs'),
      problem('min-cost-climbing-stairs', 'Min Cost Climbing Stairs'),
      problem('house-robber', 'House Robber'),
      problem('house-robber-ii', 'House Robber II'),
      problem('longest-palindromic-substring', 'Longest Palindromic Substring'),
      problem('palindromic-substrings', 'Palindromic Substrings'),
      problem('decode-ways', 'Decode Ways'),
      problem('coin-change', 'Coin Change'),
      problem('maximum-product-subarray', 'Maximum Product Subarray'),
      problem('word-break', 'Word Break'),
      problem('longest-increasing-subsequence', 'Longest Increasing Subsequence'),
      problem('partition-equal-subset-sum', 'Partition Equal Subset Sum'),
    ],
  },
  {
    name: '2-D Dynamic Programming',
    problems: [
      problem('unique-paths', 'Unique Paths'),
      problem('longest-common-subsequence', 'Longest Common Subsequence'),
      problem(
        'best-time-to-buy-and-sell-stock-with-cooldown',
        'Best Time to Buy and Sell Stock With Cooldown'
      ),
      problem('coin-change-ii', 'Coin Change II'),
      problem('target-sum', 'Target Sum'),
      problem('interleaving-string', 'Interleaving String'),
      problem('longest-increasing-path-in-a-matrix', 'Longest Increasing Path in a Matrix'),
      problem('distinct-subsequences', 'Distinct Subsequences'),
      problem('edit-distance', 'Edit Distance'),
      problem('burst-balloons', 'Burst Balloons'),
      problem('regular-expression-matching', 'Regular Expression Matching'),
    ],
  },
  {
    name: 'Greedy',
    problems: [
      problem('maximum-subarray', 'Maximum Subarray'),
      problem('jump-game', 'Jump Game'),
      problem('jump-game-ii', 'Jump Game II'),
      problem('gas-station', 'Gas Station'),
      problem('hand-of-straights', 'Hand of Straights'),
      problem(
        'merge-triplets-to-form-target-triplet',
        'Merge Triplets to Form Target Triplet'
      ),
      problem('partition-labels', 'Partition Labels'),
      problem('valid-parenthesis-string', 'Valid Parenthesis String'),
    ],
  },
  {
    name: 'Intervals',
    problems: [
      problem('insert-interval', 'Insert Interval'),
      problem('merge-intervals', 'Merge Intervals'),
      problem('non-overlapping-intervals', 'Non-Overlapping Intervals'),
      problem('meeting-rooms', 'Meeting Rooms'),
      problem('meeting-rooms-ii', 'Meeting Rooms II'),
      problem(
        'minimum-interval-to-include-each-query',
        'Minimum Interval to Include Each Query'
      ),
    ],
  },
  {
    name: 'Math & Geometry',
    problems: [
      problem('rotate-image', 'Rotate Image'),
      problem('spiral-matrix', 'Spiral Matrix'),
      problem('set-matrix-zeroes', 'Set Matrix Zeroes'),
      problem('happy-number', 'Happy Number'),
      problem('plus-one', 'Plus One'),
      problem('powx-n', 'Pow(x, n)'),
      problem('multiply-strings', 'Multiply Strings'),
      problem('detect-squares', 'Detect Squares'),
    ],
  },
  {
    name: 'Bit Manipulation',
    problems: [
      problem('single-number', 'Single Number'),
      problem('number-of-1-bits', 'Number of 1 Bits'),
      problem('counting-bits', 'Counting Bits'),
      problem('reverse-bits', 'Reverse Bits'),
      problem('missing-number', 'Missing Number'),
      problem('sum-of-two-integers', 'Sum of Two Integers'),
      problem('reverse-integer', 'Reverse Integer'),
    ],
  },
];

/** Every problem in roadmap order — the order the "next up" card walks. */
export const NEETCODE_150_ORDER: { problem: PracticeProblem; pattern: string }[] =
  NEETCODE_150.flatMap((pattern) =>
    pattern.problems.map((problem) => ({ problem, pattern: pattern.name }))
  );

export const NEETCODE_150_TOTAL = NEETCODE_150_ORDER.length;
