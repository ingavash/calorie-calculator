import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('CalorieFlow E2E Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('Case 1: Starts in unpopulated state with female pink theme and Gadget avatar', () => {
    render(<App />)
    expect(document.body.dataset.theme).toBe('female')
    expect(screen.getByTestId('app-wrapper')).toHaveAttribute('data-theme', 'female')

    const avatar = screen.getByTestId('character-avatar')
    expect(avatar).toHaveAttribute('src', './gadget.jpg')
    expect(avatar).toHaveAttribute('alt', 'Гаєчка')

    expect(screen.getByLabelText(/Вік/i)).toHaveValue(null)
    expect(screen.getByLabelText(/Вага/i)).toHaveValue(null)
    expect(screen.getByLabelText(/Зріст/i)).toHaveValue(null)

    expect(screen.getByTestId('bmr-value')).toHaveTextContent('0')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('0')
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('0')
    expect(screen.getByText(/Ви ще не додали жодного прийому їжі/i)).toBeInTheDocument()
  })

  it('Case 2: Enters user profile, calculates BMR/TDEE, and switches to Male theme with Monterey Jack', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/Вік/i), '26')
    await user.type(screen.getByLabelText(/Вага/i), '62')
    await user.type(screen.getByLabelText(/Зріст/i), '168')

    // Female: 10*62 + 6.25*168 - 5*26 - 161 = 1379 BMR
    // TDEE: 1379 * 1.375 = 1896
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1379')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('1896')
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('1896')

    // Switch to male
    await user.click(screen.getByRole('button', { name: /Чоловіча/i }))
    expect(document.body.dataset.theme).toBe('male')
    expect(screen.getByTestId('app-wrapper')).toHaveAttribute('data-theme', 'male')

    const avatar = screen.getByTestId('character-avatar')
    expect(avatar).toHaveAttribute('src', './monterey.jpg')
    expect(avatar).toHaveAttribute('alt', 'Рокфор')

    // Male: 10*62 + 6.25*168 - 5*26 + 5 = 1545 BMR
    // TDEE: 1545 * 1.375 = 2124
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1545')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('2124')
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('2124')

    // Switch goals: lose (-18%) -> 2124 * 0.82 = 1742
    await user.click(screen.getByRole('button', { name: /Схуднення/i }))
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('1742')

    // Switch goals: gain (+15%) -> 2124 * 1.15 = 2443
    await user.click(screen.getByRole('button', { name: /Набір маси/i }))
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('2443')
  })

  it('Case 3: Recalculates dynamically when activity level changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/Вік/i), '26')
    await user.type(screen.getByLabelText(/Вага/i), '62')
    await user.type(screen.getByLabelText(/Зріст/i), '168')

    const activitySelect = screen.getByLabelText(/Рівень фізичної активності/i)
    await user.selectOptions(activitySelect, '1.55')
    // 1379 * 1.55 = 2137
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('2137')
  })

  it('Case 4: Prevents negative values in input fields', async () => {
    render(<App />)

    const ageInput = screen.getByLabelText(/Вік/i)
    fireEvent.change(ageInput, { target: { value: '-20' } })
    expect(ageInput).toHaveValue(null)

    const weightInput = screen.getByLabelText(/Вага/i)
    fireEvent.change(weightInput, { target: { value: '-70' } })
    expect(weightInput).toHaveValue(null)
  })

  it('Case 5: Adds presets and custom foods with decimal macros, deletes single items and clears diary', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Quick add Banana (105 kcal, 1.3 protein, 0.4 fat, 27 carbs)
    await user.click(screen.getByRole('button', { name: /\+ Банан/i }))
    expect(screen.getByTestId('consumed-kcal-heading')).toHaveTextContent('105 / 0 ккал')
    expect(screen.getByTestId('protein-summary')).toHaveTextContent('1.3 / 0 г')
    expect(screen.getByTestId('fat-summary')).toHaveTextContent('0.4 / 0 г')
    expect(screen.getByTestId('carbs-summary')).toHaveTextContent('27 / 0 г')

    // Delete Banana
    const deleteBtn = screen.getByTitle('Видалити')
    await user.click(deleteBtn)
    expect(screen.getByText(/Ви ще не додали жодного прийому їжі/i)).toBeInTheDocument()

    // Add multiple items and clear diary
    await user.click(screen.getByRole('button', { name: /\+ Банан/i }))
    await user.click(screen.getByRole('button', { name: /\+ Яйця/i }))
    const clearBtn = screen.getByRole('button', { name: /Очистити щоденник/i })
    await user.click(clearBtn)
    expect(screen.getByText(/Ви ще не додали жодного прийому їжі/i)).toBeInTheDocument()
  })

  it('Case 6: Auto-calculates calories from macros when calories input is omitted', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText(/Назва страви/i), 'Ізолят протеїну')
    await user.type(screen.getByLabelText('Білки'), '25')
    await user.type(screen.getByLabelText('Жири'), '2')
    await user.type(screen.getByLabelText('Вуглеводи'), '10')

    // 25*4 + 2*9 + 10*4 = 100 + 18 + 40 = 158 kcal
    await user.click(screen.getByRole('button', { name: /Додати/i }))

    expect(screen.getByText('Ізолят протеїну')).toBeInTheDocument()
    expect(screen.getByTestId('consumed-kcal-heading')).toHaveTextContent('158 / 0 ккал')
  })

  it('Case 7: Displays surplus warning badge when consumed calories exceed target', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText(/Назва страви/i), 'Піца 4 сири')
    await user.type(screen.getByLabelText('Калорії'), '1200')
    await user.click(screen.getByRole('button', { name: /Додати/i }))

    expect(screen.getByTestId('remaining-badge')).toHaveTextContent(/Перевищення на 1200 ккал/i)
  })

  it('Case 8: Share button copies URL and displays confirmation', async () => {
    const user = userEvent.setup()
    render(<App />)

    const shareBtn = screen.getByRole('button', { name: /Поділитися/i })
    await user.click(shareBtn)

    expect(screen.getByText(/Посилання скопійовано!/i)).toBeInTheDocument()
  })

  it('Case 9: Recovers safely from corrupted or malformed localStorage', () => {
    localStorage.setItem('cf_profile_v2', '{"corrupted":')
    localStorage.setItem('cf_meals_v2', '12345')

    render(<App />)
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('0')
    expect(screen.getByText(/Ви ще не додали жодного прийому їжі/i)).toBeInTheDocument()
  })
})
