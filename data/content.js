/* SPA 45 curriculum data. Edit questions and visual data here without touching app logic. */

const SESSIONS = [
  {
    "id": "w1-d1",
    "week": 1,
    "kind": "weekday",
    "slot": 1,
    "label": "평일 1",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "문장을 끝까지 말하고 핵심부터 답하기",
    "theme": "현재 업무와 역할",
    "interview": [
      "Tell me about your current job and your main responsibilities.",
      "Which part of your work requires the most careful analysis?",
      "What do you enjoy most about working as an automotive engineer?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "회의 시간 변경",
        "passage": "A project meeting was originally scheduled for Tuesday morning. However, a supplier reported that important test data would not be ready until Wednesday. The team moved the meeting to Thursday afternoon so everyone could review the data first. The project manager asked each department to send questions by Wednesday evening.",
        "question": "Summarize the passage in your own words. Was moving the meeting the right decision? Explain why.",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Was moving the meeting the right decision?"
          }
        ],
        "audioId": "w1-d1-s1"
      },
      {
        "type": "visual",
        "title": "Customer priorities when buying a car",
        "kind": "bar",
        "labels": [
          "Safety",
          "Efficiency",
          "Comfort",
          "Design"
        ],
        "values": [
          42,
          28,
          19,
          11
        ],
        "unit": "%",
        "question": "Describe the main findings in the chart. Which result should an automaker pay the most attention to, and why?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Safety compare with Design?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Which result should an automaker pay the most attention to, and why?"
          }
        ]
      }
    ],
    "order": 1
  },
  {
    "id": "w1-d2",
    "week": 1,
    "kind": "weekday",
    "slot": 2,
    "label": "평일 2",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "문장을 끝까지 말하고 핵심부터 답하기",
    "theme": "NVH와 harshness",
    "interview": [
      "How would you explain NVH to someone who is not an engineer?",
      "What does harshness mean in the context of NVH?",
      "Can you give an example of harshness that a driver might notice?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Average vehicle noise during a road test",
        "kind": "line",
        "labels": [
          "0 min",
          "10 min",
          "20 min",
          "30 min",
          "40 min"
        ],
        "values": [
          52,
          55,
          61,
          58,
          54
        ],
        "unit": "dB",
        "question": "Describe the overall pattern in the chart. What might explain the peak at twenty minutes?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "When is the value highest, and what happens after that point?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What might explain the peak at twenty minutes?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "장비 고장",
        "scenario": "A key test machine stops working one day before an important deadline.",
        "question": "Explain what you would do first, how you would inform others, and how you would protect the schedule.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you do first in this situation?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you inform your manager and the other teams?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What would you do if the original deadline could not be changed?"
          }
        ]
      }
    ],
    "order": 2
  },
  {
    "id": "w1-d3",
    "week": 1,
    "kind": "weekday",
    "slot": 3,
    "label": "평일 3",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "문장을 끝까지 말하고 핵심부터 답하기",
    "theme": "소음·진동 개선의 중요성",
    "interview": [
      "Why is it important to reduce noise and vibration in vehicles?",
      "Which matters more in NVH work, customer comfort or vehicle quality?",
      "Can you describe a common noise or vibration issue that drivers may notice?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "새 소프트웨어 도입",
        "passage": "A company introduced new analysis software to reduce the time needed to review test results. Some experienced employees were worried because the interface was unfamiliar. The company offered short workshops and paired each employee with a trained coworker. After one month, most teams completed their reports faster than before.",
        "question": "Summarize the passage in your own words. What else could the company do to support employees during the change?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What else could the company do to support employees during the change?"
          }
        ],
        "audioId": "w1-d3-s1"
      },
      {
        "type": "visual",
        "title": "Reasons for project delays",
        "kind": "pie",
        "labels": [
          "Late data",
          "Design changes",
          "Equipment",
          "Other"
        ],
        "values": [
          40,
          30,
          20,
          10
        ],
        "unit": "%",
        "question": "Summarize the chart and suggest one way to reduce the largest cause of delay.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Late data compare with Other?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      }
    ],
    "order": 3
  },
  {
    "id": "w1-d4",
    "week": 1,
    "kind": "weekday",
    "slot": 4,
    "label": "평일 4",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "문장을 끝까지 말하고 핵심부터 답하기",
    "theme": "측정과 데이터 분석",
    "interview": [
      "What steps do you usually follow when you test a vehicle?",
      "How do you decide whether test data is reliable?",
      "What would you do if the measurement results were different from what you expected?"
    ],
    "specials": [
      {
        "type": "situation",
        "title": "상반된 시험 결과",
        "scenario": "Two teams report different results from tests of the same component.",
        "question": "Explain how you would investigate the difference and decide what to report.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you check first when the two results do not match?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you decide which result is more reliable?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What would you report if the cause could not be confirmed immediately?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "차량 소음 신고",
        "passage": "Several drivers reported a rattling sound that appeared only on rough roads. Engineers first checked the suspension but found no damage. They later discovered that a loose interior panel was causing the sound. The company updated the assembly process and inspected vehicles that had already been produced.",
        "question": "Summarize the passage in your own words. Which step in the response was most important?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Which step in the response was most important?"
          }
        ],
        "audioId": "w1-d4-s2"
      }
    ],
    "order": 4
  },
  {
    "id": "w1-d5",
    "week": 1,
    "kind": "weekday",
    "slot": 5,
    "label": "평일 5",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "문장을 끝까지 말하고 핵심부터 답하기",
    "theme": "팀워크와 의사소통",
    "interview": [
      "What makes communication effective in an engineering team?",
      "How do you explain a technical issue to a coworker from another department?",
      "Can you describe a time when good communication prevented a problem?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Portable vibration sensor",
        "kind": "product",
        "features": [
          "Lightweight",
          "Wireless data transfer",
          "8-hour battery",
          "Real-time alerts"
        ],
        "question": "Present this product to an engineering team. Explain its main benefits and respond to one possible concern.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the product and its main features."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which feature would be most valuable to the target user, and why?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Explain its main benefits and respond to one possible concern."
          }
        ]
      },
      {
        "type": "listening",
        "title": "재택근무 실험",
        "passage": "An engineering team tested a hybrid work schedule for three months. Employees completed individual analysis work at home and came to the office for testing and meetings. Productivity remained stable, but some junior employees said it was harder to ask quick questions. The team decided to add daily online office hours with senior engineers.",
        "question": "Summarize the passage in your own words. Do you think a hybrid schedule is suitable for engineering teams?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Do you think a hybrid schedule is suitable for engineering teams?"
          }
        ],
        "audioId": "w1-d5-s2"
      }
    ],
    "order": 5
  },
  {
    "id": "w1-e1",
    "week": 1,
    "kind": "weekend",
    "slot": 1,
    "label": "주말 1",
    "minutes": 120,
    "mode": "연습·교정",
    "focus": "문장을 끝까지 말하고 핵심부터 답하기",
    "theme": "프로젝트 설명",
    "interview": [
      "Tell me about a project that you found interesting.",
      "What was your specific role in that project?",
      "What did you learn from the project?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "충전소 확대",
        "passage": "A city plans to install more electric vehicle charging stations in public parking areas. Officials expect the project to make electric vehicles more convenient for residents. Some local businesses are concerned that construction may reduce parking space temporarily. The city will begin with a small pilot program before expanding the project.",
        "question": "Summarize the passage in your own words. What should the city measure during the pilot program?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What should the city measure during the pilot program?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w1-e1-s1"
      },
      {
        "type": "listening",
        "title": "품질 검사 지연",
        "passage": "A factory found that one quality inspection step was taking longer than expected. Management considered removing the step to speed up production. Engineers warned that the inspection had detected several serious defects in the past. Instead, the company added an automated tool to support the inspectors.",
        "question": "Summarize the passage in your own words. Do you agree with the company's final decision?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Do you agree with the company's final decision?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w1-e1-s2"
      },
      {
        "type": "visual",
        "title": "Engineering team meeting",
        "kind": "photo",
        "question": "Describe the engineering meeting, identify the technical clues, and explain how the team should reach a decision.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What evidence suggests that the group is discussing a technical design rather than a general business topic?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "How could the team make sure everyone’s concerns are considered before making a decision?"
          }
        ],
        "image": "./images/01.png"
      },
      {
        "type": "visual",
        "title": "Test completion time by method",
        "kind": "bar",
        "labels": [
          "Method A",
          "Method B",
          "Method C"
        ],
        "values": [
          48,
          36,
          29
        ],
        "unit": "min",
        "question": "Compare the three methods. Which method would you recommend if accuracy were similar?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Method A compare with Method C?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Which method would you recommend if accuracy were similar?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "회의에서 발언하지 않는 동료",
        "scenario": "One coworker has useful knowledge but rarely speaks during meetings.",
        "question": "Explain how you would encourage the coworker to contribute without causing discomfort.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you encourage the coworker to share ideas?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How could you do that without making the coworker uncomfortable?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What should the meeting leader change for future meetings?"
          }
        ]
      }
    ],
    "order": 6
  },
  {
    "id": "w1-e2",
    "week": 1,
    "kind": "weekend",
    "slot": 2,
    "label": "주말 2",
    "minutes": 120,
    "mode": "모의고사",
    "focus": "문장을 끝까지 말하고 핵심부터 답하기",
    "theme": "업무 동기와 강점",
    "interview": [
      "What motivates you to do your job well?",
      "What is your strongest quality as an engineer?",
      "How has that quality helped your team?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "교육 방식 변경",
        "passage": "A company used to provide one long safety course every year. Employees often forgot important details several months later. The company replaced it with short monthly lessons and quick quizzes. After six months, safety test scores improved and employees reported that the information was easier to remember.",
        "question": "Summarize the passage in your own words. Why might shorter lessons be more effective?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Why might shorter lessons be more effective?"
          }
        ],
        "audioId": "w1-e2-s1"
      },
      {
        "type": "visual",
        "title": "Vehicle inspection area",
        "kind": "photo",
        "question": "Describe the vehicle inspection, identify the areas being checked, and explain why the findings should be documented.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "Which parts of the vehicle appear to be receiving attention?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Why is it important to record the inspection findings before the vehicle leaves the area?"
          }
        ],
        "image": "./images/02.png"
      },
      {
        "type": "situation",
        "title": "고객 요청 변경",
        "scenario": "A customer asks for a major change after testing has already started.",
        "question": "Explain how you would evaluate the request and communicate the impact.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you check before accepting the customer’s request?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you explain the effect on the schedule and cost?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What would you do if the customer still demanded the change?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Cabin noise before and after an acoustic package",
        "kind": "bar",
        "labels": [
          "Idle",
          "City road",
          "Highway",
          "Rough road"
        ],
        "values": [
          49,
          58,
          66,
          72
        ],
        "values2": [
          45,
          50,
          55,
          61
        ],
        "series1": "Standard cabin",
        "series2": "Acoustic package",
        "unit": " dB",
        "question": "Compare the two sets of results. How effective was the acoustic package, and where is more improvement still needed?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which category shows the largest difference between the two series?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "How effective was the acoustic package, and where is more improvement still needed?"
          }
        ]
      }
    ],
    "mock5": true,
    "order": 7
  },
  {
    "id": "w2-d1",
    "week": 2,
    "kind": "weekday",
    "slot": 1,
    "label": "평일 1",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "이유·세부내용·비교를 붙이기",
    "theme": "의견 차이 대응",
    "interview": [
      "What would you do if a coworker disagreed with your idea?",
      "How would you decide which idea was better?",
      "Can disagreement ever improve a project? Why or why not?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "도로 소음 연구",
        "passage": "Researchers compared traffic noise in three neighborhoods. The area near the highway had the highest average noise level, while a residential area with many trees had the lowest. Noise levels increased during the morning rush hour in all three locations. The researchers recommended more sound barriers and better traffic management.",
        "question": "Summarize the passage in your own words. Which recommendation would you prioritize?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Which recommendation would you prioritize?"
          }
        ],
        "audioId": "w2-d1-s1"
      },
      {
        "type": "visual",
        "title": "Electric vehicle sales over five years",
        "kind": "line",
        "labels": [
          "2022",
          "2023",
          "2024",
          "2025",
          "2026"
        ],
        "values": [
          12,
          18,
          27,
          39,
          55
        ],
        "unit": "thousand",
        "question": "Describe the trend and explain one possible reason for the change.",
        "values2": [
          20,
          25,
          31,
          38,
          44
        ],
        "series1": "Electric vehicles",
        "series2": "Hybrid vehicles",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How do the two trends differ, and where is the gap most noticeable?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      }
    ],
    "order": 8
  },
  {
    "id": "w2-d2",
    "week": 2,
    "kind": "weekday",
    "slot": 2,
    "label": "평일 2",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "이유·세부내용·비교를 붙이기",
    "theme": "예상치 못한 일정 변경",
    "interview": [
      "Tell me about a time when your schedule changed unexpectedly.",
      "How did you reorganize your work after the change?",
      "What would you do differently if the same situation happened again?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Three testing options",
        "kind": "table",
        "headers": [
          "Method",
          "Time",
          "Cost",
          "Accuracy"
        ],
        "rows": [
          [
            "A",
            "40 min",
            "Low",
            "Medium"
          ],
          [
            "B",
            "55 min",
            "Medium",
            "High"
          ],
          [
            "C",
            "30 min",
            "High",
            "High"
          ]
        ],
        "question": "Compare the options and recommend one method for an urgent but important test.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this table."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which option offers the best balance of the factors shown?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "보고서 오류",
        "scenario": "You notice a numerical error in a report that has already been sent to your manager.",
        "question": "Explain what you would do and how you would prevent a similar error.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you do as soon as you noticed the error?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you explain the mistake to your manager?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What process would you change to prevent the same error?"
          }
        ]
      }
    ],
    "order": 9
  },
  {
    "id": "w2-d3",
    "week": 2,
    "kind": "weekday",
    "slot": 3,
    "label": "평일 3",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "이유·세부내용·비교를 붙이기",
    "theme": "업무 우선순위",
    "interview": [
      "How do you prioritize your tasks when several deadlines are close?",
      "What factors make one task more urgent than another?",
      "How do you inform others when a task may be delayed?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "부품 공급 문제",
        "passage": "A supplier informed an automaker that a key component would arrive two weeks late. The production team considered using a different part, but engineers needed time to test its performance. The company reduced production for several days rather than using an untested component. It also began searching for a second long-term supplier.",
        "question": "Summarize the passage in your own words. Was reducing production the best choice?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Was reducing production the best choice?"
          }
        ],
        "audioId": "w2-d3-s1"
      },
      {
        "type": "visual",
        "title": "Busy urban intersection",
        "kind": "photo",
        "question": "Describe the intersection, identify the most vulnerable road users, and suggest a safety improvement.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "Which road users appear most vulnerable in this scene, and why?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What change would most improve both safety and traffic flow at this intersection?"
          }
        ],
        "image": "./images/03.png"
      }
    ],
    "order": 10
  },
  {
    "id": "w2-d4",
    "week": 2,
    "kind": "weekday",
    "slot": 4,
    "label": "평일 4",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "이유·세부내용·비교를 붙이기",
    "theme": "기술 문제 해결",
    "interview": [
      "Tell me about a technical problem you had to solve.",
      "How did you identify the cause of the problem?",
      "What did you do to make sure the problem would not happen again?"
    ],
    "specials": [
      {
        "type": "situation",
        "title": "업무 과부하",
        "scenario": "Your team receives three urgent tasks at the same time, but there are not enough people to complete all of them immediately.",
        "question": "Explain how you would set priorities and communicate the plan.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you decide which task should be handled first?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you divide the work among the team?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "How would you communicate a possible delay?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "고객 설문",
        "passage": "A vehicle company asked customers which features mattered most when buying a new car. Safety ranked first, followed by fuel efficiency and comfort. Entertainment features were important to younger customers but less important to older customers. The company decided to offer different option packages for different customer groups.",
        "question": "Summarize the passage in your own words. How should the company use the survey results?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "How should the company use the survey results?"
          }
        ],
        "audioId": "w2-d4-s2"
      }
    ],
    "order": 11
  },
  {
    "id": "w2-d5",
    "week": 2,
    "kind": "weekday",
    "slot": 5,
    "label": "평일 5",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "이유·세부내용·비교를 붙이기",
    "theme": "비전문가에게 설명하기",
    "interview": [
      "How would you explain your work to a customer with no engineering background?",
      "What technical terms would you avoid or simplify?",
      "Why is clear communication with non-engineers important?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Smart maintenance app",
        "kind": "product",
        "features": [
          "Tracks service history",
          "Predicts maintenance",
          "Sends reminders",
          "Connects to service centers"
        ],
        "question": "Explain why a driver might use this app and address a privacy concern.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the product and its main features."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which feature would be most valuable to the target user, and why?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Employee training preferences",
        "kind": "pie",
        "labels": [
          "Hands-on",
          "Video",
          "Workshop",
          "Manual"
        ],
        "values": [
          38,
          27,
          22,
          13
        ],
        "unit": "%",
        "question": "Describe the preferences shown and recommend a training format for new software.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Hands-on compare with Manual?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      }
    ],
    "order": 12
  },
  {
    "id": "w2-e1",
    "week": 2,
    "kind": "weekend",
    "slot": 1,
    "label": "주말 1",
    "minutes": 120,
    "mode": "연습·교정",
    "focus": "이유·세부내용·비교를 붙이기",
    "theme": "부서 간 협업",
    "interview": [
      "Describe a situation in which you worked with another department.",
      "What was difficult about coordinating with that team?",
      "How did you keep everyone focused on the same goal?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "예방 정비",
        "passage": "A delivery company began using sensors to monitor the condition of its vehicles. The sensors could identify unusual vibration before a part failed. Maintenance teams repaired several vehicles early and reduced unexpected breakdowns. Although the system was expensive, the company saved money by avoiding delivery delays.",
        "question": "Summarize the passage in your own words. What is the main advantage of preventive maintenance?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What is the main advantage of preventive maintenance?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w2-e1-s1"
      },
      {
        "type": "listening",
        "title": "회의 방식 개선",
        "passage": "A team noticed that its weekly meetings often lasted more than two hours. Many topics were discussed, but few decisions were made. The team began sending background information before the meeting and limited each agenda item to ten minutes. Meetings became shorter, and action items were clearer.",
        "question": "Summarize the passage in your own words. What is one rule you would add to make meetings more effective?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What is one rule you would add to make meetings more effective?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w2-e1-s2"
      },
      {
        "type": "visual",
        "title": "Customer complaints by category",
        "kind": "bar",
        "labels": [
          "Noise",
          "Software",
          "Interior",
          "Fuel use"
        ],
        "values": [
          34,
          26,
          21,
          19
        ],
        "unit": "cases",
        "question": "Describe the chart and explain how the company should respond to the top category.",
        "values2": [
          22,
          18,
          15,
          14
        ],
        "series1": "Before improvements",
        "series2": "After improvements",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which category shows the largest difference between the two series?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Employee working with test data",
        "kind": "photo",
        "question": "Describe the employee’s work, explain what information may be compared, and identify a necessary verification step.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What kinds of information does the employee appear to be comparing on the two screens?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What should the employee verify before reporting a conclusion based on the data?"
          }
        ],
        "image": "./images/04.png"
      },
      {
        "type": "situation",
        "title": "새 절차 반대",
        "scenario": "Several experienced coworkers resist a new quality-control procedure.",
        "question": "Explain how you would respond and how you could gain their support.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you respond to the coworkers’ concerns?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "What evidence could help you gain their support?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What would you do if they continued to resist the procedure?"
          }
        ]
      }
    ],
    "order": 13
  },
  {
    "id": "w2-e2",
    "week": 2,
    "kind": "weekend",
    "slot": 2,
    "label": "주말 2",
    "minutes": 120,
    "mode": "모의고사",
    "focus": "이유·세부내용·비교를 붙이기",
    "theme": "요구사항 변경",
    "interview": [
      "What would you do if a project requirement changed near the deadline?",
      "How would you explain the impact of the change to your manager?",
      "When should a team reject a late change request?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "보행자 안전",
        "passage": "A city added brighter streetlights and clearer road markings near several schools. Drivers reduced their speed, and the number of near-miss incidents decreased. Parents welcomed the changes, but some residents complained about light entering their homes at night. The city plans to adjust the direction of the lights.",
        "question": "Summarize the passage in your own words. How can the city balance safety and residents' concerns?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "How can the city balance safety and residents' concerns?"
          }
        ],
        "audioId": "w2-e2-s1"
      },
      {
        "type": "visual",
        "title": "Average commute time after a new bus route",
        "kind": "line",
        "labels": [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May"
        ],
        "values": [
          46,
          43,
          39,
          37,
          36
        ],
        "unit": "min",
        "question": "Describe the change over time. Has the new route been effective?",
        "values2": [
          45,
          44,
          43,
          42,
          41
        ],
        "series1": "New route users",
        "series2": "City average",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How do the two trends differ, and where is the gap most noticeable?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Has the new route been effective?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "공급업체 지연",
        "scenario": "A supplier says an essential part will arrive ten days late.",
        "question": "Explain the options you would consider and which people you would involve.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What option would you consider first?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "Which people or departments should be involved in the decision?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "How would you reduce the risk of another supplier delay?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Compact EV charger",
        "kind": "product",
        "features": [
          "Fast installation",
          "Weather resistant",
          "Mobile monitoring",
          "Energy scheduling"
        ],
        "question": "Recommend this charger to an apartment manager and explain one limitation honestly.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the product and its main features."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which feature would be most valuable to the target user, and why?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      }
    ],
    "mock5": true,
    "order": 14
  },
  {
    "id": "w3-d1",
    "week": 3,
    "kind": "weekday",
    "slot": 1,
    "label": "평일 1",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "경험과 문제해결을 순서대로 설명하기",
    "theme": "실수와 배움",
    "interview": [
      "Tell me about a mistake you made at work.",
      "How did you respond after you noticed the mistake?",
      "What did you learn from that experience?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "배터리 재활용",
        "passage": "Electric vehicle batteries lose capacity after many years of use. Some companies are developing systems to reuse old batteries for energy storage in buildings. This can extend the life of the batteries and reduce waste. However, engineers must carefully test each battery before it is reused.",
        "question": "Summarize the passage in your own words. What is the biggest challenge in reusing old batteries?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What is the biggest challenge in reusing old batteries?"
          }
        ],
        "audioId": "w3-d1-s1"
      },
      {
        "type": "visual",
        "title": "Defects found by inspection stage",
        "kind": "bar",
        "labels": [
          "Incoming",
          "Assembly",
          "Final",
          "Road test"
        ],
        "values": [
          18,
          31,
          12,
          7
        ],
        "unit": "defects",
        "question": "Which stage found the most defects? What action should the factory take?",
        "values2": [
          11,
          20,
          9,
          5
        ],
        "series1": "Before process change",
        "series2": "After process change",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which category shows the largest difference between the two series?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What action should the factory take?"
          }
        ]
      }
    ],
    "order": 15
  },
  {
    "id": "w3-d2",
    "week": 3,
    "kind": "weekday",
    "slot": 2,
    "label": "평일 2",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "경험과 문제해결을 순서대로 설명하기",
    "theme": "마감 압박",
    "interview": [
      "How do you work effectively under time pressure?",
      "What kinds of mistakes are more likely when people rush?",
      "How can a team meet a deadline without reducing quality?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Public EV charging station",
        "kind": "photo",
        "question": "Describe the charging station, explain the visible capacity problem, and suggest a way to reduce waiting.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What details suggest that demand may be higher than the available charging capacity?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What could the station operator do to reduce waiting time for drivers?"
          }
        ],
        "image": "./images/05.png"
      },
      {
        "type": "situation",
        "title": "신입사원 실수",
        "scenario": "A new employee makes the same minor mistake several times.",
        "question": "Explain how you would give feedback and help the employee improve.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you discuss the repeated mistake with the employee?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "What kind of training or support would you provide?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "How would you check whether the employee had improved?"
          }
        ]
      }
    ],
    "order": 16
  },
  {
    "id": "w3-d3",
    "week": 3,
    "kind": "weekday",
    "slot": 3,
    "label": "평일 3",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "경험과 문제해결을 순서대로 설명하기",
    "theme": "고객 불만",
    "interview": [
      "How would you respond to a customer who complained about vehicle noise?",
      "What information would you ask the customer to provide?",
      "How would you explain the next steps to the customer?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "신입사원 멘토링",
        "passage": "A department created a mentoring program for new employees. Each new employee met a senior coworker twice a month to discuss technical questions and workplace communication. New employees became productive more quickly and reported less stress. Senior employees also said the program helped them improve their leadership skills.",
        "question": "Summarize the passage in your own words. What makes a mentoring program successful?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What makes a mentoring program successful?"
          }
        ],
        "audioId": "w3-d3-s1"
      },
      {
        "type": "visual",
        "title": "Weekly work time by activity",
        "kind": "pie",
        "labels": [
          "Testing",
          "Analysis",
          "Meetings",
          "Reports"
        ],
        "values": [
          35,
          30,
          20,
          15
        ],
        "unit": "%",
        "question": "Summarize how time is spent. Which activity might be reduced or improved?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Testing compare with Reports?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Which activity might be reduced or improved?"
          }
        ]
      }
    ],
    "order": 17
  },
  {
    "id": "w3-d4",
    "week": 3,
    "kind": "weekday",
    "slot": 4,
    "label": "평일 4",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "경험과 문제해결을 순서대로 설명하기",
    "theme": "개선 아이디어",
    "interview": [
      "Tell me about an improvement you would like to make in your workplace.",
      "What benefits would your idea provide?",
      "How would you persuade your team to try it?"
    ],
    "specials": [
      {
        "type": "situation",
        "title": "안전과 일정 충돌",
        "scenario": "A safety check may delay a planned product test.",
        "question": "Explain what decision you would make and how you would justify it.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "Which should take priority, the safety check or the planned schedule?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you justify your decision to the project team?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What could you do to reduce the delay without weakening safety?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "시험 장비 공유",
        "passage": "Two teams needed the same test equipment during the same week. At first, both teams said their work was more urgent. The managers reviewed the project deadlines and created a shared schedule with evening testing slots. Both teams completed the critical tests, although some employees had to adjust their working hours.",
        "question": "Summarize the passage in your own words. How could the teams avoid this problem in the future?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "How could the teams avoid this problem in the future?"
          }
        ],
        "audioId": "w3-d4-s2"
      }
    ],
    "order": 18
  },
  {
    "id": "w3-d5",
    "week": 3,
    "kind": "weekday",
    "slot": 5,
    "label": "평일 5",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "경험과 문제해결을 순서대로 설명하기",
    "theme": "새 기술 학습",
    "interview": [
      "How do you learn a new tool or technical skill?",
      "Do you prefer learning alone or with other people?",
      "How do you know when you have learned a skill well enough to use it at work?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "On-time test completion before and after a shared dashboard",
        "kind": "line",
        "labels": [
          "Week 1",
          "Week 2",
          "Week 3",
          "Week 4",
          "Week 5",
          "Week 6"
        ],
        "values": [
          62,
          66,
          69,
          71,
          73,
          75
        ],
        "values2": [
          64,
          72,
          79,
          84,
          88,
          90
        ],
        "series1": "Before dashboard",
        "series2": "After dashboard",
        "unit": "%",
        "question": "Compare the two trends. What evidence suggests that the dashboard improved teamwork?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How do the two trends differ, and where is the gap most noticeable?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What evidence suggests that the dashboard improved teamwork?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "차량 공유 서비스",
        "passage": "A transportation company launched a car-sharing service near train stations. Users could reserve a vehicle through an app and pay by the hour. The service was popular on weekends but used less on weekdays. The company plans to offer discounts to commuters during weekday mornings.",
        "question": "Summarize the passage in your own words. Do you think the discount will increase weekday use?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Do you think the discount will increase weekday use?"
          }
        ],
        "audioId": "w3-d5-s2"
      }
    ],
    "order": 19
  },
  {
    "id": "w3-e1",
    "week": 3,
    "kind": "weekend",
    "slot": 1,
    "label": "주말 1",
    "minutes": 120,
    "mode": "연습·교정",
    "focus": "경험과 문제해결을 순서대로 설명하기",
    "theme": "불완전한 데이터로 결정",
    "interview": [
      "What would you do if you had to make a decision with incomplete data?",
      "Which risks would you consider first?",
      "How would you explain the uncertainty to your manager?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "부품 경량화",
        "passage": "Engineers redesigned a metal component using a lighter material. The new part reduced vehicle weight and improved energy efficiency. However, it was more expensive and required additional durability testing. The team decided to use it only in premium models at first.",
        "question": "Summarize the passage in your own words. Was a limited launch a sensible strategy?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Was a limited launch a sensible strategy?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w3-e1-s1"
      },
      {
        "type": "listening",
        "title": "정보 공유 오류",
        "passage": "A test result was updated, but one team continued using the old version of the report. This caused confusion during a design review. The company introduced a shared document system that clearly showed the latest version and notified users of changes. It also assigned one person to manage final reports.",
        "question": "Summarize the passage in your own words. Which change will be most effective in preventing future errors?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Which change will be most effective in preventing future errors?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w3-e1-s2"
      },
      {
        "type": "visual",
        "title": "Battery capacity over years of use",
        "kind": "line",
        "labels": [
          "Year 1",
          "Year 2",
          "Year 3",
          "Year 4",
          "Year 5"
        ],
        "values": [
          100,
          96,
          91,
          85,
          78
        ],
        "unit": "%",
        "question": "Describe the trend and explain how this information could help customers.",
        "values2": [
          100,
          98,
          95,
          91,
          87
        ],
        "series1": "Standard battery",
        "series2": "Improved battery",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How do the two trends differ, and where is the gap most noticeable?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Automated production line",
        "kind": "photo",
        "question": "Describe the production line, compare the roles of robots and workers, and identify work that should remain under human supervision.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What tasks are being performed by the robots, and what are the workers doing?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Which safety or quality checks should remain under human supervision?"
          }
        ],
        "image": "./images/06.png"
      },
      {
        "type": "situation",
        "title": "불명확한 지시",
        "scenario": "Your manager gives you an urgent task, but the requirements are unclear.",
        "question": "Explain how you would get clarification without wasting time.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you ask your manager first?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you confirm the most important requirements quickly?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What would you do if your manager was not immediately available?"
          }
        ]
      }
    ],
    "order": 20
  },
  {
    "id": "w3-e2",
    "week": 3,
    "kind": "weekend",
    "slot": 2,
    "label": "주말 2",
    "minutes": 120,
    "mode": "모의고사",
    "focus": "경험과 문제해결을 순서대로 설명하기",
    "theme": "갈등 해결",
    "interview": [
      "Tell me about a conflict that can happen in a project team.",
      "What should a team leader do first in that situation?",
      "How can the team rebuild trust after the conflict?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "대중교통 앱",
        "passage": "A city released an app that shows real-time bus arrival information. Most users said the app reduced uncertainty while waiting. However, the information was sometimes inaccurate during heavy traffic. The city is working with bus operators to improve location data.",
        "question": "Summarize the passage in your own words. How important is accuracy for this kind of app?",
        "maxPlays": 1,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "How important is accuracy for this kind of app?"
          }
        ],
        "audioId": "w3-e2-s1"
      },
      {
        "type": "visual",
        "title": "Reported vibration by road type",
        "kind": "bar",
        "labels": [
          "Highway",
          "City",
          "Rough road",
          "Parking"
        ],
        "values": [
          12,
          21,
          48,
          8
        ],
        "unit": "reports",
        "question": "Compare the road types and suggest what engineers should test first.",
        "values2": [
          8,
          14,
          28,
          5
        ],
        "series1": "Before repair",
        "series2": "After repair",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which category shows the largest difference between the two series?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "회의 시간 부족",
        "scenario": "A meeting is about to end, but the team has not made an important decision.",
        "question": "Explain how you would help the team reach a useful conclusion.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you do before the meeting ends?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you help the team identify the most important decision?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "When would it be better to schedule a follow-up meeting?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Average diagnosis time before and after wireless sensors",
        "kind": "bar",
        "labels": [
          "Rattle",
          "Steering vibration",
          "Seat vibration",
          "Motor noise"
        ],
        "values": [
          95,
          80,
          110,
          70
        ],
        "values2": [
          48,
          42,
          55,
          39
        ],
        "series1": "Before sensors",
        "series2": "After sensors",
        "unit": " min",
        "question": "Compare the diagnosis times. Which type of problem benefited most from the sensors?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which category shows the largest difference between the two series?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Which type of problem benefited most from the sensors?"
          }
        ]
      }
    ],
    "mock5": true,
    "order": 21
  },
  {
    "id": "w4-d1",
    "week": 4,
    "kind": "weekday",
    "slot": 1,
    "label": "평일 1",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "업무·기술·의견을 확장하기",
    "theme": "전기차와 자동차 기술",
    "interview": [
      "How are electric vehicles changing the work of automotive engineers?",
      "What new NVH challenges can electric vehicles create?",
      "Which vehicle technology do you think will improve the most in the next five years?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "소음 규제",
        "passage": "A local government proposed stricter nighttime noise limits for delivery vehicles. Residents supported the proposal, while delivery companies worried about higher costs. One suggested solution was to encourage quieter electric delivery vehicles. The government plans to provide financial support during the transition.",
        "question": "Summarize the passage in your own words. Is financial support necessary for the policy to work?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Is financial support necessary for the policy to work?"
          }
        ],
        "audioId": "w4-d1-s1"
      },
      {
        "type": "visual",
        "title": "Supplier comparison",
        "kind": "table",
        "headers": [
          "Supplier",
          "Price",
          "Delivery",
          "Quality"
        ],
        "rows": [
          [
            "Alpha",
            "Low",
            "14 days",
            "Good"
          ],
          [
            "Beta",
            "Medium",
            "7 days",
            "Excellent"
          ],
          [
            "Gamma",
            "High",
            "5 days",
            "Good"
          ]
        ],
        "question": "Compare the suppliers and choose one for a time-sensitive project.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this table."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which option offers the best balance of the factors shown?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      }
    ],
    "order": 22
  },
  {
    "id": "w4-d2",
    "week": 4,
    "kind": "weekday",
    "slot": 2,
    "label": "평일 2",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "업무·기술·의견을 확장하기",
    "theme": "품질과 비용",
    "interview": [
      "How should a company balance product quality and cost?",
      "When is it reasonable to choose a less expensive solution?",
      "What could happen if a company focuses too much on cost reduction?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Technical presentation",
        "kind": "photo",
        "question": "Describe the presentation, interpret the audience’s response, and suggest how the presenter could improve clarity.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "How do the audience members appear to be responding to the presentation?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What could the presenter do to explain the technical information more clearly?"
          }
        ],
        "image": "./images/07.png"
      },
      {
        "type": "situation",
        "title": "부서 간 책임 공방",
        "scenario": "Two departments blame each other for a project delay.",
        "question": "Explain how you would move the discussion from blame to problem-solving.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you stop the discussion from focusing on blame?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "What information should the departments review together?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "How would you prevent the same coordination problem?"
          }
        ]
      }
    ],
    "order": 23
  },
  {
    "id": "w4-d3",
    "week": 4,
    "kind": "weekday",
    "slot": 3,
    "label": "평일 3",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "업무·기술·의견을 확장하기",
    "theme": "데이터 기반 의사결정",
    "interview": [
      "Why is data important when engineers make decisions?",
      "Can data ever lead people to the wrong conclusion?",
      "What should engineers check before presenting test results?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "실험 반복",
        "passage": "An engineer received a test result that was very different from previous results. Instead of reporting it immediately, she checked the equipment and repeated the test under the same conditions. The second result matched the earlier data, and she found that one sensor had been connected incorrectly. She documented the error and updated the setup checklist.",
        "question": "Summarize the passage in your own words. Why was repeating the test important?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Why was repeating the test important?"
          }
        ],
        "audioId": "w4-d3-s1"
      },
      {
        "type": "visual",
        "title": "Preferred commuting methods",
        "kind": "pie",
        "labels": [
          "Car",
          "Bus",
          "Train",
          "Bicycle"
        ],
        "values": [
          46,
          24,
          20,
          10
        ],
        "unit": "%",
        "question": "Describe the chart and suggest a policy that could reduce car use.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Car compare with Bicycle?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      }
    ],
    "order": 24
  },
  {
    "id": "w4-d4",
    "week": 4,
    "kind": "weekday",
    "slot": 4,
    "label": "평일 4",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "업무·기술·의견을 확장하기",
    "theme": "안전과 편안함",
    "interview": [
      "Which should have higher priority in vehicle development, safety or comfort?",
      "Can improving comfort also improve safety?",
      "How would you respond if a comfortable design created a safety concern?"
    ],
    "specials": [
      {
        "type": "situation",
        "title": "데이터 누락",
        "scenario": "You discover that part of the test data is missing after the test vehicle is no longer available.",
        "question": "Explain how you would assess the risk and decide the next step.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you assess the importance of the missing data?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "What alternatives would you consider before making a decision?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "How would you explain the remaining uncertainty to your manager?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "공장 자동화",
        "passage": "A factory installed robots for repetitive lifting tasks. Production increased, and employees reported fewer back injuries. Some workers were concerned that automation would reduce jobs, so the company trained them to operate and maintain the new equipment. Most of the workers moved into higher-skilled roles.",
        "question": "Summarize the passage in your own words. How should companies manage the human impact of automation?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "How should companies manage the human impact of automation?"
          }
        ],
        "audioId": "w4-d4-s2"
      }
    ],
    "order": 25
  },
  {
    "id": "w4-d5",
    "week": 4,
    "kind": "weekday",
    "slot": 5,
    "label": "평일 5",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "업무·기술·의견을 확장하기",
    "theme": "주도성과 리더십",
    "interview": [
      "Tell me about a time when you took initiative at work.",
      "How did other people respond to your idea?",
      "What is the difference between taking initiative and ignoring team decisions?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Vehicle interior acoustic test",
        "kind": "photo",
        "question": "Describe the acoustic test, identify the equipment, and explain what the engineer may learn from the data.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What test equipment can you identify, and where is it positioned?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What could the engineer learn by comparing the microphone data with the graphs on the laptop?"
          }
        ],
        "image": "./images/08.png"
      },
      {
        "type": "visual",
        "title": "Noise level before and after repair",
        "kind": "line",
        "labels": [
          "Idle",
          "20 km/h",
          "40 km/h",
          "60 km/h"
        ],
        "values": [
          49,
          54,
          60,
          65
        ],
        "values2": [
          45,
          48,
          52,
          55
        ],
        "series2": "After repair",
        "series1": "Before repair",
        "unit": "dB",
        "question": "Compare the two lines. How effective was the repair?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How do the two trends differ, and where is the gap most noticeable?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "How effective was the repair?"
          }
        ]
      }
    ],
    "order": 26
  },
  {
    "id": "w4-e1",
    "week": 4,
    "kind": "weekend",
    "slot": 1,
    "label": "주말 1",
    "minutes": 120,
    "mode": "연습·교정",
    "focus": "업무·기술·의견을 확장하기",
    "theme": "혁신과 현실성",
    "interview": [
      "What makes an engineering idea innovative?",
      "How can a team test whether a new idea is practical?",
      "Should companies invest in risky ideas? Why or why not?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "온라인 고객지원",
        "passage": "A company added an AI chatbot to answer simple customer questions. Response times became much faster, but customers were frustrated when the chatbot could not understand unusual problems. The company added an option to connect directly with a human agent. Customer satisfaction improved after the change.",
        "question": "Summarize the passage in your own words. When should a customer be connected to a human agent?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "When should a customer be connected to a human agent?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w4-e1-s1"
      },
      {
        "type": "listening",
        "title": "자전거 출퇴근",
        "passage": "A company encouraged employees to commute by bicycle by adding showers and secure parking. More employees began cycling during mild weather, but participation fell in winter. The company is considering public transportation subsidies as a second option. Its goal is to reduce parking demand and employee commuting emissions.",
        "question": "Summarize the passage in your own words. Which benefit of the program is most important?",
        "maxPlays": 2,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Which benefit of the program is most important?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What is one practical lesson from this situation, and why?"
          }
        ],
        "audioId": "w4-e1-s2"
      },
      {
        "type": "visual",
        "title": "Customer at a service center",
        "kind": "photo",
        "question": "Describe the service-center conversation, interpret the customer’s concern, and explain how the employee should confirm the issue.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What clues suggest that the customer may be explaining a problem or concern?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "How should the service employee confirm the issue before promising a solution?"
          }
        ],
        "image": "./images/09.png"
      },
      {
        "type": "visual",
        "title": "Software errors before and after training",
        "kind": "bar",
        "labels": [
          "Week 1",
          "Week 2",
          "Week 3",
          "Week 4"
        ],
        "values": [
          18,
          14,
          9,
          6
        ],
        "unit": "errors",
        "question": "Describe the pattern and evaluate whether the training was effective.",
        "values2": [
          16,
          11,
          7,
          4
        ],
        "series1": "Without coaching",
        "series2": "With coaching",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which category shows the largest difference between the two series?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "고객에게 기술 문제 설명",
        "scenario": "A customer is upset about a technical issue and does not understand the engineering explanation.",
        "question": "Explain how you would communicate the problem and the solution more clearly.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you explain the problem in simpler language?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "What would you do to make sure the customer understood the next steps?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "How would you respond if the customer remained upset?"
          }
        ]
      }
    ],
    "order": 27
  },
  {
    "id": "w4-e2",
    "week": 4,
    "kind": "weekend",
    "slot": 2,
    "label": "주말 2",
    "minutes": 120,
    "mode": "모의고사",
    "focus": "업무·기술·의견을 확장하기",
    "theme": "안전 우려 보고",
    "interview": [
      "What would you do if you discovered a possible safety issue before a product launch?",
      "How would you report the issue if others wanted to keep the schedule?",
      "What information would decision-makers need before taking action?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "시험 순서 변경",
        "passage": "A team changed the order of two vehicle tests to save setup time. The new sequence reduced total testing time by fifteen percent. However, engineers found that heat from the first test affected the second result. The team added a cooling period and kept part of the new sequence.",
        "question": "Summarize the passage in your own words. What lesson did the team learn?",
        "maxPlays": 1,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What lesson did the team learn?"
          }
        ],
        "audioId": "w4-e2-s1"
      },
      {
        "type": "visual",
        "title": "Vehicle feature ratings",
        "kind": "table",
        "headers": [
          "Feature",
          "Model X",
          "Model Y"
        ],
        "rows": [
          [
            "Safety",
            "9",
            "8"
          ],
          [
            "Comfort",
            "7",
            "9"
          ],
          [
            "Efficiency",
            "8",
            "7"
          ],
          [
            "Price",
            "6",
            "8"
          ]
        ],
        "question": "Compare the two models and recommend one for a family buyer.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this table."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which option offers the best balance of the factors shown?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "예산 삭감",
        "scenario": "Your project budget is reduced by fifteen percent after the plan has been approved.",
        "question": "Explain how you would revise the plan while protecting the most important goals.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "Which part of the project would you protect first?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you decide what to reduce or postpone?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "How would you explain the revised plan to the team?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Unexpected breakdowns before and after predictive maintenance",
        "kind": "bar",
        "labels": [
          "Q1",
          "Q2",
          "Q3",
          "Q4"
        ],
        "values": [
          18,
          17,
          16,
          15
        ],
        "values2": [
          15,
          11,
          8,
          6
        ],
        "series1": "Previous process",
        "series2": "Predictive maintenance",
        "unit": " cases",
        "question": "Compare the quarterly results. How effective was predictive maintenance?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "Which category shows the largest difference between the two series?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "How effective was predictive maintenance?"
          }
        ]
      }
    ],
    "mock5": true,
    "order": 28
  },
  {
    "id": "w5-d1",
    "week": 5,
    "kind": "weekday",
    "slot": 1,
    "label": "평일 1",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "실전 통합과 약점 보강",
    "theme": "경력 목표",
    "interview": [
      "What professional goal would you like to achieve in the next few years?",
      "Which skill do you need to improve to reach that goal?",
      "How will you measure your progress?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "서비스센터 예약",
        "passage": "A vehicle service center introduced online appointment scheduling. Customers could choose available times and describe their vehicle problems in advance. Waiting times decreased, but some older customers had difficulty using the website. The center kept a phone reservation option and added simple instructions.",
        "question": "Summarize the passage in your own words. Why is it useful to offer more than one reservation method?",
        "maxPlays": 1,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Why is it useful to offer more than one reservation method?"
          }
        ],
        "audioId": "w5-d1-s1"
      },
      {
        "type": "visual",
        "title": "Road test in rainy weather",
        "kind": "photo",
        "question": "Describe the rainy road test, identify conditions that may affect the results, and suggest a safer test procedure.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What weather and road conditions could affect the test results?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "How should the driver change the test procedure to keep the road test both safe and useful?"
          }
        ],
        "image": "./images/10.png"
      }
    ],
    "order": 29
  },
  {
    "id": "w5-d2",
    "week": 5,
    "kind": "weekday",
    "slot": 2,
    "label": "평일 2",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "실전 통합과 약점 보강",
    "theme": "변화 적응",
    "interview": [
      "Tell me about a change at work that was difficult to adapt to.",
      "What helped you become comfortable with the change?",
      "How can managers help employees adapt more quickly?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Sources of workplace stress",
        "kind": "pie",
        "labels": [
          "Deadlines",
          "Workload",
          "Communication",
          "Other"
        ],
        "values": [
          36,
          32,
          22,
          10
        ],
        "unit": "%",
        "question": "Summarize the chart and recommend one practical action for managers.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Deadlines compare with Other?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What practical conclusion can you draw from this visual?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "팀원의 갑작스러운 부재",
        "scenario": "A key team member becomes unavailable during a critical week.",
        "question": "Explain how you would redistribute the work and reduce disruption.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you do first after learning that the team member was unavailable?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you redistribute the urgent work?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What could the team do to reduce this kind of dependency in the future?"
          }
        ]
      }
    ],
    "order": 30
  },
  {
    "id": "w5-d3",
    "week": 5,
    "kind": "weekday",
    "slot": 3,
    "label": "평일 3",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "실전 통합과 약점 보강",
    "theme": "미래 모빌리티",
    "interview": [
      "How do you think people will travel differently in the future?",
      "What role will autonomous vehicles play?",
      "What is one concern society should address before autonomous vehicles become common?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "친환경 포장",
        "passage": "A parts supplier replaced plastic packaging with recyclable cardboard. The change reduced plastic waste, but some components were damaged during transport. The supplier strengthened the cardboard design and tested it in humid conditions. Damage rates then returned to their previous level.",
        "question": "Summarize the passage in your own words. What should the supplier consider before making similar changes?",
        "maxPlays": 1,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What should the supplier consider before making similar changes?"
          }
        ],
        "audioId": "w5-d3-s1"
      },
      {
        "type": "visual",
        "title": "Charging time by charger type",
        "kind": "bar",
        "labels": [
          "Home",
          "Standard public",
          "Fast public"
        ],
        "values": [
          420,
          150,
          35
        ],
        "unit": "min",
        "question": "Compare the charging options. Which one is most suitable for a long trip?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How does Home compare with Fast public?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Which one is most suitable for a long trip?"
          }
        ]
      }
    ],
    "order": 31
  },
  {
    "id": "w5-d4",
    "week": 5,
    "kind": "weekday",
    "slot": 4,
    "label": "평일 4",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "실전 통합과 약점 보강",
    "theme": "추천과 설득",
    "interview": [
      "Imagine that your team must choose between two testing methods. How would you make a recommendation?",
      "What evidence would make your recommendation convincing?",
      "How would you respond if your manager chose the other method?"
    ],
    "specials": [
      {
        "type": "situation",
        "title": "새 아이디어 위험",
        "scenario": "You have an idea that could save time, but it has not been tested.",
        "question": "Explain how you would propose and test the idea safely.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you present the idea without hiding the risk?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you test the idea on a small scale?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What result would convince you to use the idea more widely?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "교통 데이터",
        "passage": "A city analyzed traffic data from major intersections. Congestion was highest between seven and nine in the morning and increased sharply when it rained. The city adjusted traffic signal timing during peak periods and added warning messages on rainy days. Average travel time decreased slightly.",
        "question": "Summarize the passage in your own words. What other action could reduce congestion?",
        "maxPlays": 1,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What other action could reduce congestion?"
          }
        ],
        "audioId": "w5-d4-s2"
      }
    ],
    "order": 32
  },
  {
    "id": "w5-d5",
    "week": 5,
    "kind": "weekday",
    "slot": 5,
    "label": "평일 5",
    "minutes": 60,
    "mode": "일반 집중",
    "focus": "실전 통합과 약점 보강",
    "theme": "업무 종합 설명",
    "interview": [
      "Describe a typical challenge in your current job.",
      "How do your technical skills help you handle that challenge?",
      "How do your communication skills help you handle it?"
    ],
    "specials": [
      {
        "type": "visual",
        "title": "Apartment charging demand and available capacity",
        "kind": "line",
        "labels": [
          "6 PM",
          "7 PM",
          "8 PM",
          "9 PM",
          "10 PM",
          "11 PM"
        ],
        "values": [
          20,
          34,
          49,
          58,
          46,
          30
        ],
        "values2": [
          35,
          35,
          45,
          55,
          55,
          40
        ],
        "series1": "Charging demand",
        "series2": "Available capacity",
        "unit": " kW",
        "question": "Compare demand with capacity. At what time is the system under the most pressure, and what should the manager do?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How do the two trends differ, and where is the gap most noticeable?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "At what time is the system under the most pressure, and what should the manager do?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "팀 회고",
        "passage": "After completing a difficult project, a team held a review meeting. Members discussed what worked, what caused delays, and what should change next time. The manager focused on processes rather than blaming individuals. The team created three specific actions for the next project.",
        "question": "Summarize the passage in your own words. Why is it important to avoid blaming individuals in a review meeting?",
        "maxPlays": 1,
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Why is it important to avoid blaming individuals in a review meeting?"
          }
        ],
        "audioId": "w5-d5-s2"
      }
    ],
    "order": 33
  },
  {
    "id": "w5-e1",
    "week": 5,
    "kind": "weekend",
    "slot": 1,
    "label": "주말 1",
    "minutes": 120,
    "mode": "연습·교정",
    "focus": "실전 통합과 약점 보강",
    "theme": "도전적인 프로젝트",
    "interview": [
      "Tell me about the most challenging project you have worked on.",
      "What was the turning point in that project?",
      "How did the experience change the way you work?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "배터리 시험 중단",
        "passage": "During a battery endurance test, the cooling system produced an unexpected warning. The team paused the test even though the temperature was still within the normal range. Engineers inspected the sensors and found that one connector was loose. After replacing it and reviewing the earlier data, they restarted the test the next morning.",
        "question": "Summarize the passage in your own words. Was pausing the test the right decision? Explain why.",
        "maxPlays": 1,
        "audioId": "w5-e1-s1",
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "Was pausing the test the right decision? Why or why not?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "What should the engineers check before restarting the test?"
          }
        ]
      },
      {
        "type": "listening",
        "title": "공급업체 데이터 불일치",
        "passage": "An automaker received two reports from a supplier that showed different durability results for the same part. Instead of choosing the better result, the purchasing and engineering teams asked for the original test conditions. They discovered that the supplier had used different temperatures in the two tests. The companies agreed on one standard procedure and repeated the test.",
        "question": "Summarize the passage in your own words. What lesson should the teams apply to future supplier data?",
        "maxPlays": 1,
        "audioId": "w5-e1-s2",
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What lesson should the teams apply to future supplier data?"
          },
          {
            "role": "followUp",
            "label": "추가 후속 질문",
            "text": "How could the two companies prevent the same problem in the future?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Hands-on employee workshop",
        "kind": "photo",
        "question": "Describe the workshop, explain how the participants are involved, and discuss the value of hands-on training.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What role does the instructor appear to have, and how are the participants involved?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "Why can hands-on training be more effective than a lecture for this kind of technical work?"
          }
        ],
        "image": "./images/11.png"
      },
      {
        "type": "visual",
        "title": "Defect reports by testing stage",
        "kind": "bar",
        "labels": [
          "Prototype",
          "Pre-production",
          "Launch",
          "After launch"
        ],
        "values": [
          38,
          24,
          11,
          7
        ],
        "unit": " cases",
        "question": "Describe the pattern in the chart. What does it suggest about the value of early testing?",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "How do the Prototype and After launch stages compare?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What does the chart suggest about the value of early testing?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "발표 직전 변경",
        "scenario": "Important data changes one hour before your presentation.",
        "question": "Explain how you would update the presentation and communicate the uncertainty.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "What would you update first in the presentation?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "How would you explain the changed data and the uncertainty?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What would you do if there was not enough time to revise every slide?"
          }
        ]
      }
    ],
    "order": 34
  },
  {
    "id": "w5-e2",
    "week": 5,
    "kind": "weekend",
    "slot": 2,
    "label": "주말 2",
    "minutes": 120,
    "mode": "모의고사",
    "focus": "실전 통합과 약점 보강",
    "theme": "좋은 엔지니어",
    "interview": [
      "What qualities make someone a good automotive engineer?",
      "Which of those qualities are most important in your current role?",
      "What would you advise a new engineer to focus on during the first year?"
    ],
    "specials": [
      {
        "type": "listening",
        "title": "자율주행 셔틀 시범운행",
        "passage": "A university tested an autonomous shuttle on a short campus route. The shuttle operated safely at low speed, but it stopped frequently when pedestrians walked close to the road. Students liked the convenience, while drivers behind the shuttle complained about delays. The university decided to adjust the route and collect more data before expanding the service.",
        "question": "Summarize the passage in your own words. What should the university evaluate before expanding the service?",
        "maxPlays": 1,
        "audioId": "w5-e2-s1",
        "questions": [
          {
            "role": "main",
            "label": "요약",
            "text": "Please summarize the passage in your own words."
          },
          {
            "role": "followUp",
            "label": "후속 질문",
            "text": "What should the university evaluate before expanding the service?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Battery temperature during fast charging",
        "kind": "line",
        "labels": [
          "0 min",
          "10 min",
          "20 min",
          "30 min",
          "40 min",
          "50 min"
        ],
        "values": [
          24,
          31,
          40,
          47,
          45,
          39
        ],
        "values2": [
          24,
          29,
          35,
          39,
          38,
          34
        ],
        "series1": "Standard cooling",
        "series2": "Improved cooling",
        "unit": "°C",
        "question": "Compare the temperature patterns and explain what the results suggest about the cooling systems.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe the main information shown in this chart."
          },
          {
            "role": "followUp",
            "label": "정보 확인·비교",
            "text": "When is the gap between the two cooling systems the largest?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What do these results suggest the company should improve next?"
          }
        ]
      },
      {
        "type": "situation",
        "title": "비현실적인 마감",
        "scenario": "A stakeholder requests a deadline that your team believes is unrealistic.",
        "question": "Explain how you would negotiate a more realistic plan.",
        "questions": [
          {
            "role": "main",
            "label": "상황 대응",
            "text": "How would you explain that the requested deadline is unrealistic?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 1",
            "text": "What evidence would you use to propose a new schedule?"
          },
          {
            "role": "followUp",
            "label": "후속 질문 2",
            "text": "What compromise could you offer if the stakeholder refused your first proposal?"
          }
        ]
      },
      {
        "type": "visual",
        "title": "Engineering control room",
        "kind": "photo",
        "question": "Describe the control room, identify the information being monitored, and explain what should be verified before action is taken.",
        "questions": [
          {
            "role": "main",
            "label": "자료 설명",
            "text": "Please describe what is happening in this image."
          },
          {
            "role": "followUp",
            "label": "정보 확인·추론",
            "text": "What types of information are the employees monitoring on the screens?"
          },
          {
            "role": "followUp",
            "label": "해석·의견",
            "text": "What should the team verify before changing the production process?"
          }
        ],
        "image": "./images/12.png"
      }
    ],
    "mock5": true,
    "order": 35
  }
];

const WARMUP_BANK = [
  "Please introduce yourself briefly.",
  "What do you usually do after work?",
  "How do you normally commute to work?",
  "What do you enjoy doing on weekends?",
  "Tell me about a recent meal you enjoyed.",
  "What is one place you visit often?",
  "How do you usually relax after a busy day?",
  "What kind of weather do you prefer, and why?",
  "Tell me about a useful item you bought recently.",
  "What is one habit you would like to improve?",
  "Do you prefer planning ahead or being flexible?",
  "What kind of music or media do you enjoy?",
  "Tell me about a person you often spend time with.",
  "What is one thing you are looking forward to?",
  "Describe a typical weekday in your life."
];

/* Fixed strategy-strengthening questions. One is assigned to every non-mock session. */
const STRATEGY_TASKS = {
  "w1-d1": [{
    "type": "interview",
    "title": "자기소개 · 기본 정보",
    "question": "Please introduce yourself and briefly explain where you work.",
    "guide": "이름과 소속을 짧고 자연스럽게 말하세요.",
    "strategyArea": "자기소개",
    "expressions": [
      {"text":"Thank you for giving me this opportunity.","cue":"기회를 주셔서 감사하다고 인사할 때","category":"자기소개"},
      {"text":"I work in the automotive industry, focusing on ___.","cue":"소속 산업과 담당 분야를 소개할 때","category":"자기소개"}
    ]
  }],
  "w1-d2": [{
    "type": "interview",
    "title": "자기소개 · 주요 업무",
    "question": "What are your main responsibilities at work?",
    "guide": "복잡한 기술용어보다 핵심 역할을 쉬운 말로 설명하세요.",
    "strategyArea": "자기소개",
    "expressions": [
      {"text":"My main responsibility is to test and measure vehicle noise.","cue":"주요 업무를 설명할 때","category":"자기소개"},
      {"text":"to ensure product quality","cue":"제품 품질을 확보하기 위해","category":"이유 설명"}
    ]
  }],
  "w1-d3": [{
    "type": "interview",
    "title": "업무와 기술 · 효율성",
    "question": "What digital tool or smart device do you use most often at work, and how does it help you?",
    "guide": "도구 이름보다 시간 절약과 업무 효율성에 초점을 맞추세요.",
    "strategyArea": "업무·기술",
    "expressions": [
      {"text":"improve work efficiency","cue":"업무 효율을 높이다","category":"장점 설명"},
      {"text":"save time and energy","cue":"시간과 에너지를 절약하다","category":"장점 설명"},
      {"text":"Using smart devices can improve work efficiency.","cue":"스마트 기기의 장점을 말할 때","category":"이유 설명"}
    ]
  }],
  "w1-d4": [{
    "type": "interview",
    "title": "자기소개 · 강점과 취미",
    "question": "What personal strength helps you at work, and what do you enjoy doing in your free time?",
    "guide": "업무 강점 하나와 인간적인 취미 하나를 연결하세요.",
    "strategyArea": "자기소개",
    "expressions": [
      {"text":"People say I am a well-organized person.","cue":"정리정돈을 잘하는 강점을 말할 때","category":"자기소개"},
      {"text":"In my free time, I enjoy ___.","cue":"취미를 소개할 때","category":"자기소개"}
    ]
  }],
  "w1-d5": [{
    "type": "interview",
    "title": "일상과 취미 · 스트레스 해소",
    "question": "What do you usually do to relieve stress after a busy week?",
    "guide": "활동 하나를 말하고 왜 도움이 되는지 덧붙이세요.",
    "strategyArea": "일상·취미·여행",
    "expressions": [
      {"text":"relieve stress","cue":"스트레스를 해소하다","category":"이유 설명"},
      {"text":"recharge my batteries","cue":"에너지를 다시 충전하다","category":"이유 설명"},
      {"text":"It is a great way to relieve stress after a busy week.","cue":"취미의 효과를 설명할 때","category":"장점 설명"}
    ]
  }],
  "w1-e1": [{
    "type": "interview",
    "title": "자기소개 · 전체 답변",
    "question": "Please give a complete self-introduction as if you were beginning the SPA interview.",
    "guide": "기본 정보, 업무, 강점이나 취미, 마무리를 45~60초로 연결하세요.",
    "strategyArea": "자기소개",
    "expressions": [
      {"text":"Today, I am excited to be here, and I will do my best.","cue":"자기소개를 긍정적으로 마무리할 때","category":"자기소개"},
      {"text":"I recently went on business trips to the U.S. and Mexico for vehicle testing.","cue":"해외 출장 경험을 소개할 때","category":"경험 이야기"}
    ]
  }],

  "w2-d1": [{
    "type": "situation",
    "title": "가정 상황 · 동료의 반대",
    "scenario": "A coworker strongly disagrees with your idea during a team discussion.",
    "question": "If you were in this situation, what would you do first, and how would you reach an agreement?",
    "guide": "첫 행동, 이유, 다음 조치를 순서대로 말하세요.",
    "strategyArea": "가정 상황",
    "expressions": [
      {"text":"If I were in that situation, I would ___.","cue":"가정 상황에서 첫 행동을 말할 때","category":"가정 상황"},
      {"text":"listen to the other person's point of view","cue":"상대방의 관점을 듣다","category":"문제 해결"},
      {"text":"find a solution that works for both sides","cue":"양쪽 모두에게 맞는 해결책을 찾다","category":"문제 해결"}
    ]
  }],
  "w2-d2": [{
    "type": "situation",
    "title": "가정 상황 · 일정 변경",
    "scenario": "An important project deadline is suddenly moved forward by one week.",
    "question": "If you were responsible for the schedule, how would you reorganize the work?",
    "guide": "우선순위 조정, 소통, 시간 절약 방안을 말하세요.",
    "strategyArea": "가정 상황",
    "expressions": [
      {"text":"First, I would focus on finding the best solution.","cue":"먼저 최선의 해결책을 찾겠다고 말할 때","category":"가정 상황"},
      {"text":"reorganize the priorities","cue":"우선순위를 다시 정리하다","category":"문제 해결"},
      {"text":"This would help us save time.","cue":"시간 절약 효과를 설명할 때","category":"이유 설명"}
    ]
  }],
  "w2-d3": [{
    "type": "interview",
    "title": "운동과 건강 · 운동 습관",
    "question": "What kind of exercise do you usually do, and how often do you do it?",
    "guide": "운동 종류, 빈도, 꾸준히 하는 이유를 말하세요.",
    "strategyArea": "운동·건강",
    "expressions": [
      {"text":"stay in shape","cue":"체력을 관리하고 건강을 유지하다","category":"장점 설명"},
      {"text":"develop a regular exercise routine","cue":"규칙적인 운동 습관을 만들다","category":"습관 설명"}
    ]
  }],
  "w2-d4": [{
    "type": "situation",
    "title": "가정 상황 · 예상 밖의 시험 결과",
    "scenario": "A vehicle test produces an unexpected result just before the team must make a decision.",
    "question": "If you were in charge, what would you check before making the decision?",
    "guide": "데이터 검증, 관계자 공유, 다음 시험 순서를 제시하세요.",
    "strategyArea": "가정 상황",
    "expressions": [
      {"text":"Before making a decision, I would first ___.","cue":"결정 전에 우선 확인할 일을 말할 때","category":"문제 해결"},
      {"text":"verify the data from another source","cue":"다른 출처로 데이터를 검증하다","category":"문제 해결"}
    ]
  }],
  "w2-d5": [{
    "type": "interview",
    "title": "업무와 기술 · 워라밸",
    "question": "Do you think technology can help employees achieve a better work-life balance? Why or why not?",
    "guide": "효율성의 장점과 업무 연결이 계속되는 단점을 함께 말해도 좋습니다.",
    "strategyArea": "업무·기술",
    "expressions": [
      {"text":"maintain a better work-life balance","cue":"더 나은 일과 삶의 균형을 유지하다","category":"장점 설명"},
      {"text":"Technology allows employees to work more efficiently.","cue":"기술이 효율적인 업무를 가능하게 한다고 말할 때","category":"이유 설명"}
    ]
  }],
  "w2-e1": [{
    "type": "visual-extra",
    "attachToSpecial": "Employee working with test data",
    "title": "사진 전략 · 전체 인상",
    "question": "Overall, does the workplace look organized and efficient? Please support your answer with two visual details.",
    "guide": "전체 인상을 먼저 말한 뒤 눈에 보이는 근거 두 개만 고르세요.",
    "strategyArea": "사진 묘사",
    "expressions": [
      {"text":"What I can see first is ___.","cue":"사진에서 가장 먼저 보이는 것을 말할 때","category":"사진 묘사"},
      {"text":"Overall, it looks well-organized and efficient.","cue":"사진의 전체 인상을 정리할 때","category":"사진 묘사"}
    ]
  }],

  "w3-d1": [{
    "type": "visual-extra",
    "attachToSpecial": "Defects found by inspection stage",
    "title": "그래프 전략 · 최고점과 결론",
    "question": "Which inspection stage has the highest figure, and what should the company focus on as a result?",
    "guide": "가장 높은 항목 하나와 실무적 결론 하나만 분명히 말하세요.",
    "strategyArea": "그래프 설명",
    "expressions": [
      {"text":"___ has the highest figure.","cue":"그래프에서 가장 높은 항목을 말할 때","category":"그래프 비교"},
      {"text":"In short, the company should focus on ___.","cue":"그래프의 결론을 말할 때","category":"결론 내리기"}
    ]
  }],
  "w3-d2": [{
    "type": "interview",
    "title": "여행과 여가 · 재충전 경험",
    "question": "Tell me about a trip or activity that helped you recharge and refresh your mind.",
    "guide": "장소나 활동, 인상적인 세부내용, 이후 기분 변화를 말하세요.",
    "strategyArea": "일상·취미·여행",
    "expressions": [
      {"text":"refresh my mind","cue":"기분과 머리를 새롭게 하다","category":"경험 이야기"},
      {"text":"take a break from my daily routine","cue":"일상에서 잠시 벗어나다","category":"경험 이야기"}
    ]
  }],
  "w3-d3": [{
    "type": "situation",
    "title": "가정 상황 · 고객 불만",
    "scenario": "A customer is very upset about a repeated vehicle problem and demands an immediate answer.",
    "question": "If you were the employee, how would you handle the conversation and solve the problem?",
    "guide": "먼저 듣기, 공감하기, 확인할 내용, 후속 조치를 말하세요.",
    "strategyArea": "가정 상황",
    "expressions": [
      {"text":"I would first listen carefully to the customer's concern.","cue":"고객 불만을 먼저 경청하겠다고 말할 때","category":"문제 해결"},
      {"text":"explain the next steps clearly","cue":"다음 조치를 명확히 설명하다","category":"문제 해결"}
    ]
  }],
  "w3-d4": [{
    "type": "listening",
    "title": "요약 전략 · 건강한 생활 습관",
    "passage": "Many office workers sit for long periods and feel tired even when their jobs are not physically demanding. Health experts recommend taking short walking breaks, stretching regularly, and getting enough sleep. These simple habits can improve concentration, reduce stress, and support both physical and mental health. The key is to choose realistic habits that can be continued every day.",
    "question": "Please summarize the passage by stating the topic, two main points, and the conclusion.",
    "maxPlays": 2,
    "guide": "주제 하나, 핵심 두 가지, 결론 하나만 기억해 3문장으로 요약하세요.",
    "strategyArea": "듣기 요약",
    "expressions": [
      {"text":"This passage is mainly about ___.","cue":"요약의 주제를 선언할 때","category":"요약"},
      {"text":"The speaker mentions two main points: ___ and ___.","cue":"핵심 두 가지를 연결할 때","category":"요약"},
      {"text":"In conclusion, the main point is that ___.","cue":"요약의 결론을 말할 때","category":"결론 내리기"}
    ]
  }],
  "w3-d5": [{
    "type": "interview",
    "title": "업무와 기술 · 과도한 의존",
    "question": "What problems can occur when employees rely too much on smart devices, and how can they avoid them?",
    "guide": "집중력 저하나 업무 경계 문제를 말하고 해결책을 제시하세요.",
    "strategyArea": "업무·기술",
    "expressions": [
      {"text":"rely too much on technology","cue":"기술에 지나치게 의존하다","category":"문제 설명"},
      {"text":"set clear boundaries between work and personal time","cue":"업무와 개인 시간의 경계를 정하다","category":"해결책 제안"}
    ]
  }],
  "w3-e1": [{
    "type": "visual-extra",
    "attachToSpecial": "Automated production line",
    "title": "사진 전략 · 위치와 행동",
    "question": "What can you see on the left and right sides of the image, and how are the workers interacting with the automated equipment?",
    "guide": "왼쪽, 오른쪽, 사람의 행동 순서로 단순하게 묘사하세요.",
    "strategyArea": "사진 묘사",
    "expressions": [
      {"text":"On the left side, I can see ___.","cue":"사진 왼쪽을 묘사할 때","category":"사진 묘사"},
      {"text":"On the right side, there is ___.","cue":"사진 오른쪽을 묘사할 때","category":"사진 묘사"}
    ]
  }],

  "w4-d1": [{
    "type": "interview",
    "title": "한국문화 · 외국인에게 추천",
    "question": "What aspect of Korean culture would you recommend to a foreign visitor, and why?",
    "guide": "문화 한 가지를 고르고 독특함과 접근성을 설명하세요.",
    "strategyArea": "한국문화",
    "expressions": [
      {"text":"I would recommend ___ to a foreign visitor.","cue":"외국인에게 한국문화를 추천할 때","category":"추천과 설득"},
      {"text":"It is unique and easy to experience.","cue":"독특하고 경험하기 쉽다고 말할 때","category":"이유 설명"}
    ]
  }],
  "w4-d2": [{
    "type": "interview",
    "title": "한국문화 · 세계적 인기",
    "question": "Why do you think Korean culture has become so popular around the world?",
    "guide": "세계적 인기의 이유를 독특함, 유행 선도, 온라인 접근성 중 두 가지로 설명하세요.",
    "strategyArea": "한국문화",
    "expressions": [
      {"text":"gain huge popularity worldwide","cue":"전 세계적으로 큰 인기를 얻다","category":"장점 설명"},
      {"text":"Korean culture is unique and trend-setting.","cue":"한국문화의 독특함과 유행 선도를 말할 때","category":"이유 설명"}
    ]
  }],
  "w4-d3": [{
    "type": "visual-extra",
    "attachToSpecial": "Preferred commuting methods",
    "title": "그래프 전략 · 비교와 추세",
    "question": "Which option is the most popular, and what overall pattern can you see among the remaining options?",
    "guide": "최고점 하나와 나머지의 전반적 차이만 말하세요.",
    "strategyArea": "그래프 설명",
    "expressions": [
      {"text":"This graph shows data about ___.","cue":"그래프의 주제를 소개할 때","category":"그래프 비교"},
      {"text":"___ is the most popular option.","cue":"가장 인기 있는 항목을 말할 때","category":"그래프 비교"}
    ]
  }],
  "w4-d4": [{
    "type": "interview",
    "title": "운동과 건강 · 신체와 정신",
    "question": "How does regular exercise affect people's physical and mental health?",
    "guide": "체력, 면역력, 스트레스 중 두 가지 이상을 연결하세요.",
    "strategyArea": "운동·건강",
    "expressions": [
      {"text":"boost the immune system","cue":"면역력을 높이다","category":"장점 설명"},
      {"text":"improve physical and mental health","cue":"신체적·정신적 건강을 향상시키다","category":"장점 설명"},
      {"text":"Regular exercise helps me stay in shape.","cue":"규칙적인 운동의 효과를 말할 때","category":"이유 설명"}
    ]
  }],
  "w4-d5": [{
    "type": "visual-extra",
    "attachToSpecial": "Vehicle interior acoustic test",
    "title": "사진 전략 · 전체 흐름",
    "question": "What can you see first, and what does the overall scene suggest about the purpose of the test?",
    "guide": "가장 먼저 보이는 것과 장면의 목적만 연결하세요.",
    "strategyArea": "사진 묘사",
    "expressions": [
      {"text":"This picture was taken inside a vehicle.","cue":"차량 내부에서 찍힌 사진이라고 말할 때","category":"사진 묘사"},
      {"text":"The overall scene suggests that ___.","cue":"사진 전체가 시사하는 점을 말할 때","category":"추측하기"}
    ]
  }],
  "w4-e1": [{
    "type": "listening",
    "title": "요약 전략 · 여가와 여행",
    "passage": "A company encouraged employees to use all of their annual vacation days. Managers noticed that people who took regular breaks returned with better concentration and more creative ideas. However, some employees avoided vacations because they worried about unfinished work. The company responded by improving task sharing and asking teams to prepare coverage plans before anyone traveled.",
    "question": "Please summarize the passage by stating the topic, two main points, and the conclusion.",
    "maxPlays": 2,
    "guide": "휴식의 효과와 회사의 해결책을 중심으로 3문장으로 요약하세요.",
    "strategyArea": "듣기 요약",
    "expressions": [
      {"text":"The passage explains that ___.","cue":"지문의 핵심 내용을 설명할 때","category":"요약"},
      {"text":"The key point seems to be that ___.","cue":"완벽히 기억나지 않아도 핵심을 정리할 때","category":"요약"}
    ]
  }],

  "w5-d1": [{
    "type": "interview",
    "title": "여행과 여가 · 스트레스 상황",
    "question": "Traveling can sometimes be stressful. What problems can travelers experience, and how can they deal with them?",
    "guide": "문제 하나나 두 개를 고르고 현실적인 대비책을 제안하세요.",
    "strategyArea": "일상·취미·여행",
    "expressions": [
      {"text":"Traveling helps me take a break from my daily routine.","cue":"여행의 긍정적 효과를 말할 때","category":"장점 설명"},
      {"text":"One practical solution would be to plan ahead.","cue":"여행 문제의 해결책을 제안할 때","category":"해결책 제안"}
    ]
  }],
  "w5-d2": [{
    "type": "interview",
    "title": "운동과 건강 · 꾸준히 하기",
    "question": "Many people want to exercise regularly but fail to continue. What advice would you give them?",
    "guide": "작게 시작하기, 일정 고정하기, 즐기는 활동 선택하기를 활용하세요.",
    "strategyArea": "운동·건강",
    "expressions": [
      {"text":"start with a realistic goal","cue":"현실적인 목표부터 시작하다","category":"조언하기"},
      {"text":"choose an activity that is easy to continue","cue":"꾸준히 하기 쉬운 활동을 고르다","category":"조언하기"}
    ]
  }],
  "w5-d3": [{
    "type": "visual-extra",
    "attachToSpecial": "Charging time by charger type",
    "title": "그래프 전략 · 최고점과 실용적 결론",
    "question": "Which charger has the shortest charging time, and what practical conclusion can a driver draw from the comparison?",
    "guide": "가장 낮은 시간과 사용자의 선택을 연결하세요.",
    "strategyArea": "그래프 설명",
    "expressions": [
      {"text":"___ has the shortest charging time.","cue":"가장 짧은 충전 시간을 말할 때","category":"그래프 비교"},
      {"text":"In short, ___ is the most practical option.","cue":"그래프를 실용적인 결론으로 마무리할 때","category":"결론 내리기"}
    ]
  }],
  "w5-d4": [{
    "type": "interview",
    "title": "한국문화 · 배달문화",
    "question": "Korean delivery services are fast and convenient. What are their advantages and possible disadvantages?",
    "guide": "편리함과 시간 절약을 말한 뒤 비용이나 쓰레기 문제도 덧붙이세요.",
    "strategyArea": "한국문화",
    "expressions": [
      {"text":"fast and convenient","cue":"빠르고 편리한","category":"장점 설명"},
      {"text":"save people a lot of time","cue":"사람들의 시간을 많이 절약하다","category":"장점 설명"},
      {"text":"However, it can create more packaging waste.","cue":"배달문화의 단점을 말할 때","category":"문제 설명"}
    ]
  }],
  "w5-d5": [{
    "type": "listening",
    "title": "요약 전략 · 차량 문제와 해결책",
    "passage": "A test team found an unusual vibration during a high-speed road test. The first measurement was not enough to identify the cause, so the engineers repeated the test under the same conditions and compared the results with data from another vehicle. They discovered that a loose mounting part was responsible. The team repaired the part and confirmed the improvement through a final test.",
    "question": "Please summarize the passage by stating the topic, two main points, and the conclusion.",
    "maxPlays": 2,
    "guide": "문제, 확인 과정, 최종 해결책을 3문장으로 요약하세요.",
    "strategyArea": "듣기 요약",
    "expressions": [
      {"text":"The main topic is an unusual vibration during a road test.","cue":"지문의 주제를 바로 말할 때","category":"요약"},
      {"text":"In conclusion, the team found and fixed the cause.","cue":"문제 해결 지문을 결론으로 정리할 때","category":"결론 내리기"}
    ]
  }],
  "w5-e1": [{
    "type": "listening",
    "title": "요약 전략 · 업무 기술의 장단점",
    "passage": "A company introduced an AI assistant to help employees organize documents and prepare routine reports. The tool reduced repetitive work and allowed teams to complete basic tasks faster. At the same time, managers warned employees not to share confidential information with the system and asked them to verify all important results. The company concluded that the tool was useful only when employees used it responsibly.",
    "question": "Please summarize the passage by stating the topic, two main points, and the conclusion.",
    "maxPlays": 2,
    "guide": "효율성의 장점, 주의점, 최종 결론을 기억하세요.",
    "strategyArea": "듣기 요약",
    "expressions": [
      {"text":"The speaker mentions two main points: efficiency and responsible use.","cue":"장점과 주의점을 함께 요약할 때","category":"요약"},
      {"text":"Although I do not remember every detail, the key point seems to be that ___.","cue":"세부내용을 놓쳤을 때 핵심으로 이어갈 때","category":"요약"}
    ]
  }]
};
