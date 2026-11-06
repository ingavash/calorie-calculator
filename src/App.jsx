import { useState, useEffect, useMemo } from 'react'
import {
  Flame,
  User,
  Utensils,
  Plus,
  Trash2,
  RotateCcw,
  Activity,
  Target,
  TrendingDown,
  TrendingUp,
  Scale,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Сидячий спосіб життя (мінімум руху)' },
  { value: 1.375, label: 'Легка активність (1–3 тренування/тиждень)' },
  { value: 1.55, label: 'Помірна активність (3–5 тренувань/тиждень)' },
  { value: 1.725, label: 'Висока активність (6–7 тренувань/тиждень)' },
  { value: 1.9, label: 'Екстремальна активність (фізична робота / 2 тренування в день)' },
]

const GOALS = [
  { id: 'lose', label: 'Схуднення', delta: -0.18, icon: TrendingDown },
  { id: 'maintain', label: 'Підтримка', delta: 0, icon: Scale },
  { id: 'gain', label: 'Набір маси', delta: 0.15, icon: TrendingUp },
]

const QUICK_FOODS = [
  { name: 'Вівсянка на воді (200 г)', kcal: 176, protein: 6, fat: 3, carbs: 30 },
  { name: 'Куряче філе (150 г)', kcal: 248, protein: 46, fat: 5, carbs: 0 },
  { name: 'Яйця варені (2 шт)', kcal: 155, protein: 13, fat: 11, carbs: 1 },
  { name: 'Гречка відварна (150 г)', kcal: 165, protein: 6, fat: 2, carbs: 31 },
  { name: 'Банан (1 шт)', kcal: 105, protein: 1.3, fat: 0.4, carbs: 27 },
  { name: 'Сир кисломолочний 5% (150 г)', kcal: 182, protein: 26, fat: 7.5, carbs: 3 },
  { name: 'Авокадо (100 г)', kcal: 160, protein: 2, fat: 15, carbs: 9 },
]

export default function App() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('cf_profile')
    return saved
      ? JSON.parse(saved)
      : {
          gender: 'female',
          age: 26,
          weight: 62,
          height: 168,
          activity: 1.375,
          goal: 'maintain',
        }
  })

  const [meals, setMeals] = useState(() => {
    const saved = localStorage.getItem('cf_meals')
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: 'Вівсянка з ягодами', kcal: 240, protein: 8, fat: 5, carbs: 42 },
          { id: 2, name: 'Куряче філе та салат', kcal: 320, protein: 42, fat: 10, carbs: 14 },
        ]
  })

  const [foodForm, setFoodForm] = useState({
    name: '',
    kcal: '',
    protein: '',
    fat: '',
    carbs: '',
  })

  useEffect(() => {
    localStorage.setItem('cf_profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem('cf_meals', JSON.stringify(meals))
  }, [meals])

  // Формула Міффліна — Сан-Жеора
  const stats = useMemo(() => {
    const w = Number(profile.weight) || 0
    const h = Number(profile.height) || 0
    const a = Number(profile.age) || 0
    const base = 10 * w + 6.25 * h - 5 * a
    const bmr = Math.max(0, Math.round(profile.gender === 'male' ? base + 5 : base - 161))
    const tdee = Math.round(bmr * Number(profile.activity))
    const currentGoal = GOALS.find((g) => g.id === profile.goal) || GOALS[1]
    const targetCalories = Math.round(tdee * (1 + currentGoal.delta))

    // БЖВ: 30% білки, 28% жири, 42% вуглеводи
    const targetProtein = Math.round((targetCalories * 0.3) / 4)
    const targetFat = Math.round((targetCalories * 0.28) / 9)
    const targetCarbs = Math.round((targetCalories * 0.42) / 4)

    return {
      bmr,
      tdee,
      targetCalories,
      targetProtein,
      targetFat,
      targetCarbs,
    }
  }, [profile])

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, item) => ({
        kcal: acc.kcal + (Number(item.kcal) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        fat: acc.fat + (Number(item.fat) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0),
      }),
      { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    )
  }, [meals])

  const handleAddFood = (e) => {
    e.preventDefault()
    if (!foodForm.name.trim() || !foodForm.kcal) return

    const newMeal = {
      id: Date.now(),
      name: foodForm.name.trim(),
      kcal: Math.round(Number(foodForm.kcal) || 0),
      protein: Math.round(Number(foodForm.protein) || 0),
      fat: Math.round(Number(foodForm.fat) || 0),
      carbs: Math.round(Number(foodForm.carbs) || 0),
    }

    setMeals((prev) => [newMeal, ...prev])
    setFoodForm({ name: '', kcal: '', protein: '', fat: '', carbs: '' })
  }

  const handleQuickAdd = (preset) => {
    setMeals((prev) => [
      {
        id: Date.now() + Math.random(),
        ...preset,
      },
      ...prev,
    ])
  }

  const handleDeleteMeal = (id) => {
    setMeals((prev) => prev.filter((item) => item.id !== id))
  }

  const remainingCalories = stats.targetCalories - totals.kcal
  const calorieProgress = stats.targetCalories > 0
    ? Math.min(100, Math.round((totals.kcal / stats.targetCalories) * 100))
    : 0

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Flame size={26} />
          </div>
          <div>
            <h1>CalorieFlow</h1>
            <p>Розумний калькулятор калорій, TDEE та щоденного раціону</p>
          </div>
        </div>
        {meals.length > 0 && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMeals([])}
          >
            <RotateCcw size={15} /> Очистити щоденник
          </button>
        )}
      </header>

      <main className="grid-layout">
        {/* Ліва колонка: Параметри тіла та цілі */}
        <section className="card">
          <h2 className="card-title">
            <User size={20} /> Ваші параметри та ціль
          </h2>

          <div className="form-group">
            <span className="form-label">Стать</span>
            <div className="gender-toggle">
              <button
                type="button"
                className={`toggle-btn ${profile.gender === 'female' ? 'active' : ''}`}
                onClick={() => setProfile({ ...profile, gender: 'female' })}
              >
                Жіноча
              </button>
              <button
                type="button"
                className={`toggle-btn ${profile.gender === 'male' ? 'active' : ''}`}
                onClick={() => setProfile({ ...profile, gender: 'male' })}
              >
                Чоловіча
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="age">Вік (років)</label>
              <input
                id="age"
                type="number"
                min="10"
                max="110"
                className="input-field"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="weight">Вага (кг)</label>
              <input
                id="weight"
                type="number"
                min="25"
                max="300"
                step="0.5"
                className="input-field"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label" htmlFor="height">Зріст (см)</label>
              <input
                id="height"
                type="number"
                min="100"
                max="250"
                className="input-field"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="activity">
              <Activity size={14} style={{ display: 'inline', marginRight: 4 }} />
              Рівень фізичної активності
            </label>
            <select
              id="activity"
              className="select-field"
              value={profile.activity}
              onChange={(e) => setProfile({ ...profile, activity: Number(e.target.value) })}
            >
              {ACTIVITY_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">
              <Target size={14} style={{ display: 'inline', marginRight: 4 }} />
              Ваша мета
            </span>
            <div className="goal-toggle">
              {GOALS.map((g) => {
                const Icon = g.icon
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`toggle-btn ${profile.goal === g.id ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, goal: g.id })}
                  >
                    <Icon size={15} /> {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="stats-banner">
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-value">{stats.bmr}</div>
                <div className="stat-label">Базовий обмін (BMR)</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.tdee}</div>
                <div className="stat-label">Підтримка (TDEE)</div>
              </div>
              <div className="stat-item">
                <div className="stat-value highlight">{stats.targetCalories}</div>
                <div className="stat-label">Ваша норма (ккал)</div>
              </div>
            </div>

            <div className="macros-grid">
              <div className="macro-box">
                <div className="macro-header">
                  <span>Білки</span>
                  <span>{Math.round(totals.protein)} / {stats.targetProtein} г</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, (totals.protein / (stats.targetProtein || 1)) * 100)}%`,
                      background: 'var(--protein-color)',
                    }}
                  />
                </div>
              </div>

              <div className="macro-box">
                <div className="macro-header">
                  <span>Жири</span>
                  <span>{Math.round(totals.fat)} / {stats.targetFat} г</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, (totals.fat / (stats.targetFat || 1)) * 100)}%`,
                      background: 'var(--fat-color)',
                    }}
                  />
                </div>
              </div>

              <div className="macro-box">
                <div className="macro-header">
                  <span>Вуглеводи</span>
                  <span>{Math.round(totals.carbs)} / {stats.targetCarbs} г</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, (totals.carbs / (stats.targetCarbs || 1)) * 100)}%`,
                      background: 'var(--carbs-color)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Права колонка: Щоденник харчування */}
        <section className="card">
          <h2 className="card-title">
            <Utensils size={20} /> Щоденник харчування за сьогодні
          </h2>

          <div className="calorie-ring-section">
            <div className="calorie-summary-text">
              <h3>
                {totals.kcal} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {stats.targetCalories} ккал</span>
              </h3>
              <p>Спожито сьогодні ({calorieProgress}% від денної норми)</p>
            </div>
            <div>
              {remainingCalories >= 0 ? (
                <span className="badge good">
                  <CheckCircle2 size={15} /> Залишилось: {remainingCalories} ккал
                </span>
              ) : (
                <span className="badge over">
                  <AlertCircle size={15} /> Перевищення на {Math.abs(remainingCalories)} ккал
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ШВИДКЕ ДОДАВАННЯ ПОПУЛЯРНИХ ПРОДУКТІВ:
          </div>
          <div className="presets-bar">
            {QUICK_FOODS.map((food) => (
              <button
                key={food.name}
                type="button"
                className="preset-chip"
                onClick={() => handleQuickAdd(food)}
              >
                + {food.name} ({food.kcal} ккал)
              </button>
            ))}
          </div>

          <form onSubmit={handleAddFood}>
            <div className="add-food-form">
              <input
                type="text"
                placeholder="Назва страви або продукту..."
                className="input-field"
                value={foodForm.name}
                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Калорії (ккал)*"
                className="input-field"
                min="0"
                value={foodForm.kcal}
                onChange={(e) => setFoodForm({ ...foodForm, kcal: e.target.value })}
                required
              />
              <button type="submit" className="btn-primary">
                <Plus size={18} /> Додати
              </button>
            </div>

            <div className="add-food-form" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.35rem' }}>
              <input
                type="number"
                placeholder="Білки (г)"
                className="input-field"
                min="0"
                value={foodForm.protein}
                onChange={(e) => setFoodForm({ ...foodForm, protein: e.target.value })}
              />
              <input
                type="number"
                placeholder="Жири (г)"
                className="input-field"
                min="0"
                value={foodForm.fat}
                onChange={(e) => setFoodForm({ ...foodForm, fat: e.target.value })}
              />
              <input
                type="number"
                placeholder="Вуглеводи (г)"
                className="input-field"
                min="0"
                value={foodForm.carbs}
                onChange={(e) => setFoodForm({ ...foodForm, carbs: e.target.value })}
              />
            </div>
          </form>

          <div className="food-list">
            {meals.length === 0 ? (
              <div className="empty-state">
                Ви ще не додали жодного прийому їжі. Скористайтеся швидкими кнопками вище або введіть власну страву.
              </div>
            ) : (
              meals.map((item) => (
                <div key={item.id} className="food-item">
                  <div className="food-info">
                    <h4>{item.name}</h4>
                    <span>
                      Б: {item.protein}г • Ж: {item.fat}г • В: {item.carbs}г
                    </span>
                  </div>
                  <div className="food-actions">
                    <span className="food-kcal">{item.kcal} ккал</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDeleteMeal(item.id)}
                      title="Видалити"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
