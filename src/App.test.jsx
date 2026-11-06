import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'

describe('CalorieFlow E2E User Flows', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Case 1: Default female profile renders pink theme, BMR, TDEE, and target calories accurately', () => {
    render(<App />)
    expect(document.body.dataset.theme).toBe('female')
    expect(screen.getByTestId('app-wrapper')).toHaveAttribute('data-theme', 'female')
    expect(screen.getByTestId('theme-indicator')).toHaveTextContent('Рожева тема (Жіноча)')
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1379')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('1896')
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('1896')
  })

  it('Case 2: Switching to Male switches to purple theme and updates BMR, TDEE, and goal calories', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Чоловіча/i }))
    expect(document.body.dataset.theme).toBe('male')
    expect(screen.getByTestId('app-wrapper')).toHaveAttribute('data-theme', 'male')
    expect(screen.getByTestId('theme-indicator')).toHaveTextContent('Фіолетова тема (Чоловіча)')
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1545')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('2124')

    await user.click(screen.getByRole('button', { name: /Схуднення/i }))
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('1742')

    await user.click(screen.getByRole('button', { name: /Набір маси/i }))
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('2443')
  })

  it('Case 3: Changing activity level recalculates TDEE and macros dynamically', async () => {
    const user = userEvent.setup()
    render(<App />)

    const activitySelect = screen.getByLabelText(/Рівень фізичної активності/i)
    await user.selectOptions(activitySelect, '1.55')
    // 1379 * 1.55 = 2137
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('2137')
  })

  it('Case 4: Handles cleared numeric inputs without false calculation', async () => {
    const user = userEvent.setup()
    render(<App />)

    const weightInput = screen.getByLabelText(/Вага/i)
    await user.clear(weightInput)

    expect(screen.getByTestId('bmr-value')).toHaveTextContent('0')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('0')
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('0')
  })

  it('Case 5: Supports quick-adding preset foods with decimal macros, deleting item, and clearing diary', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Очистити щоденник/i }))
    expect(screen.getByText(/Ви ще не додали жодного прийому їжі/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /\+ Банан/i }))
    expect(screen.getByTestId('consumed-kcal-heading')).toHaveTextContent('105 / 1896 ккал')
    expect(screen.getByTestId('protein-summary')).toHaveTextContent('1.3 / 142 г')
    expect(screen.getByTestId('fat-summary')).toHaveTextContent('0.4 / 59 г')

    const deleteBtn = screen.getByTitle('Видалити')
    await user.click(deleteBtn)
    expect(screen.getByText(/Ви ще не додали жодного прийому їжі/i)).toBeInTheDocument()
  })

  it('Case 6: Auto-calculates calories from macros when calories field is left empty', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Очистити щоденник/i }))

    await user.type(screen.getByPlaceholderText(/Назва страви/i), 'Протеїновий коктейль')
    await user.type(screen.getByPlaceholderText(/Білки/i), '25')
    await user.type(screen.getByPlaceholderText(/Жири/i), '2')
    await user.type(screen.getByPlaceholderText(/Вуглеводи/i), '10')

    await user.click(screen.getByRole('button', { name: /Додати/i }))

    expect(screen.getByText('Протеїновий коктейль')).toBeInTheDocument()
    expect(screen.getByTestId('consumed-kcal-heading')).toHaveTextContent('158 / 1896 ккал')
  })

  it('Case 7: Displays calorie surplus warning badge when consumed calories exceed target', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText(/Назва страви/i), 'Великий сет піци')
    await user.type(screen.getByPlaceholderText(/Калорії/i), '2000')
    await user.click(screen.getByRole('button', { name: /Додати/i }))

    expect(screen.getByTestId('remaining-badge')).toHaveTextContent(/Перевищення на 664 ккал/i)
  })

  it('Case 8: Gracefully recovers from corrupted localStorage data', () => {
    localStorage.setItem('cf_profile', '{invalid-json')
    localStorage.setItem('cf_meals', 'not-an-array')

    render(<App />)
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1379')
  })
})
