搜索逻辑实现说明
1. 对 post.content 建立 text 索引：postSchema.index({ content: 'text' })，优先使用 $text 查询；comment.content 继续使用 $regex 查询。
2. sortBy 仅保留 latest（默认）和 relevance（相关度）。
3. 精确匹配：当 keyword 为 '#'+纯数字或纯数字时，直接匹配 post.postNum 并返回结果。

混合搜索策略（Parallel Execution）：
- A 路：查询 posts 表，优先使用 $text 查 post.content，返回 _id + textScore。
  - 如果 $text 无结果，使用 $regex 对 post.content 做兜底召回，避免短词/停用词导致的漏召回。
- B 路：查询 comments 表，用 $regex 查 comment.content，提取对应的 postId。
- C 路：当 keyword 为 '#'+纯数字或纯数字时，直接匹配 post.postNum，返回结果。
- ID 聚合与去重：将 A/B 路命中的 postId 放入 Set 去重。
- 最终获取：根据合并后的 ID 列表到 posts 表查询完整详情，并统一进行过滤、排序、分页。
  - 过滤包含 status、institution（与用户同 institution 或 syncToUni=true）等条件。

评分标准：
- 命中帖子内容（$text）：使用 MongoDB 返回的 textScore（通常在 1.0 ~ 100+ 之间）。
- 命中帖子内容（$regex 兜底）：固定低分（例如 1.0）。
- 命中评论内容：固定低分（例如 1.0），代表“稍微相关”。