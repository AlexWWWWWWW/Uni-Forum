## 6. 话题分类模块

### 6.1 获取分类标签。用于forum-index和post-create页面（topics和categories都使用这个API）

**接口地址：** `GET /api/categories`

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "categories": [
      {
        "id": "all",
        "label": "全部",
        "order": 0,
        "icon": "",
        "showForCreate": false
      },
      {
        "id": "hot",
        "label": "热榜",
        "order": 1,
        "icon": "fire",
        "showForCreate": false
      },
      {
        "id": "write",
        "label": "随写",
        "order": 2,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "emotion",
        "label": "情感",
        "order": 3,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "academic",
        "label": "学业",
        "order": 4,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "job",
        "label": "求职",
        "order": 5,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "trade",
        "label": "交易",
        "order": 6,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "food",
        "label": "美食",
        "order": 7,
        "icon": "",
        "showForCreate": true
      }
    ]
  }
}
```

---
