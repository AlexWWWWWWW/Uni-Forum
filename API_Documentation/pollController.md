## 5. 投票模块

### 5.1 获取投票详情

**接口地址：** `GET /api/posts/:postId/poll`

**请求示例：**
```
GET /api/posts/123456/poll
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "pollId": "poll_123",
    "topic": "你的成绩是？",
    "allowMultiple": false,
    "totalVotes": 156,
    "options": [
      {
        "id": "opt_1",
        "text": "A",
        "voteCount": 45,
        "percentage": 28.85,
        "isVoted": false
      },
      {
        "id": "opt_2",
        "text": "B",
        "voteCount": 68,
        "percentage": 43.59,
        "isVoted": true
      }
    ],
    "userVoted": true,
    "userVotes": ["opt_2"],
    "endTime": null,
    "isEnded": false
  }
}
```

**失败响应：**
```json
{
  "code": 404,
  "message": "该帖子没有投票",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

---

### 5.2 提交投票 / 取消投票 / 切换选项

**接口地址：** `POST /api/posts/:postId/poll/vote`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "optionIds": ["opt_2"]
}
```

**字段说明：**
- `optionIds`: 必填，**用户期望的最终选中选项列表**（ID数组）
  - 单选传一个元素，多选可传多个元素
  - 传入空数组 `[]` 表示取消全部投票
  - 前端无需区分"新投/修改/取消"，直接传期望的最终状态即可
  - 后端会自动计算 diff，精确新增或移除对应选项的投票记录

**行为说明：**

| 场景 | 操作 | 传参示例 |
|------|------|----------|
| 首次投票（单选） | 选中 opt_1 | `{"optionIds": ["opt_1"]}` |
| 切换选项（单选） | 从 opt_1 改为 opt_2 | `{"optionIds": ["opt_2"]}` |
| 取消投票（单选/多选均适用） | 二次点击已选选项 | `{"optionIds": []}` |
| 首次投票（多选） | 选中 opt_1、opt_2 | `{"optionIds": ["opt_1", "opt_2"]}` |
| 多选追加选项 | 当前选了 opt_1，再选 opt_2 | `{"optionIds": ["opt_1", "opt_2"]}` |
| 多选取消某项 | 当前选了 opt_1、opt_2，取消 opt_2 | `{"optionIds": ["opt_1"]}` |

**成功响应（投票或切换选项）：**
```json
{
  "code": 200,
  "message": "投票成功",
  "data": {
    "pollId": "poll_123",
    "totalVotes": 157,
    "options": [
      {
        "id": "opt_1",
        "voteCount": 45,
        "percentage": 28.66
      },
      {
        "id": "opt_2",
        "voteCount": 69,
        "percentage": 43.95
      }
    ],
    "userVotes": ["opt_2"],
    "userVoted": true
  }
}
```

**成功响应（取消全部投票，传空数组）：**
```json
{
  "code": 200,
  "message": "已取消投票",
  "data": {
    "pollId": "poll_123",
    "totalVotes": 156,
    "options": [
      {
        "id": "opt_1",
        "voteCount": 45,
        "percentage": 28.85
      },
      {
        "id": "opt_2",
        "voteCount": 68,
        "percentage": 43.59
      }
    ],
    "userVotes": [],
    "userVoted": false
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "该投票不允许多选",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**响应字段说明：**
- `options`: 各选项最新的 `voteCount` 和 `percentage`
- `userVotes`: 操作后用户实际投票的选项ID列表（可直接用于更新前端状态，无需再调 GET 接口）
- `userVoted`: 操作后用户是否仍有有效投票

**说明：**
- 支持取消投票：传 `optionIds: []` 即可撤销全部投票
- 单选支持一键切换：直接传新选项，旧选项自动撤销
- 多选支持增量操作：前端维护当前选中列表，每次点击更新列表后传给接口即可
- `totalVotes` 按净变化量更新（多选时，新增/移除各选项都会影响 totalVotes）

---
