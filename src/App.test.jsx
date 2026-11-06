import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'

describe('CalorieFlow E2E User Flows', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('calculates default BMR, TDEE, and target calories accurately', () => {
    render(<App />)
    // Default female: 26yo, 62kg, 168cm, activity 1.375, maintain
    // BMR = 10*62 + 6.25*168 - 5*26 - 161 = 620 + 1050 - 130 - 161 = 1379
    // TDEE = round(1379 * 1.375) = 1896
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1379')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('1896')
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('1896')
  })

  it('recalculates BMR, TDEE, and goal calories when switching gender and goal', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Чоловіча' }))
    // Male BMR = 620 + 1050 - 130 + 5 = 1545
    // TDEE = round(1545 * 1.375) = 2124
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1545')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('2124')

    await user.click(screen.getByRole('button', { name: /Схуднення/i }))
    // Target = round(2124 * 0.82) = 1742
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('1742')
  })

  it('handles cleared numeric inputs without false calculation', async () => {
    const user = userEvent.setup()
    render(<App />)

    const weightInput = screen.getByLabelText(/Вага/i)
    await user.clear(weightInput)

    expect(screen.getByTestId('bmr-value')).toHaveTextContent('0')
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('0')
    expect(screen.getByTestId('target-kcal-value')).toHaveTextContent('0')
  })

  it('supports quick-adding preset foods with decimal macros and clearing the diary', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Clear initial meals
    await user.click(screen.getByRole('button', { name: /Очистити щоденник/i }))
    expect(screen.getByText(/Ви ще не додали жодного прийому їжі/i)).toBeInTheDocument()

    // Quick add Banana (105 kcal, 1.3g protein, 0.4g fat, 27g carbs)
    await user.click(screen.getByRole('button', { name: /\+ Банан/i }))
    expect(screen.getByTestId('consumed-kcal-heading')).toHaveTextContent('105 / 1896 ккал')
    expect(screen.getByTestId('protein-summary')).toHaveTextContent('1.3 / 142 г')
    expect(screen.getByTestId('fat-summary')).toHaveTextContent('0.4 / 59 г')
  })

  it('auto-calculates calories from macros when calories field is left empty', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Очистити щоденник/i }))

    await user.type(screen.getByPlaceholderText(/Назва страви/i), 'Протеїновий коктейль')
    await user.type(screen.getByPlaceholderText(/Білки/i), '25')
    await user.type(screen.getByPlaceholderText(/Жири/i), '2')
    await user.type(screen.getByPlaceholderText(/Вуглеводи/i), '10')

    // Auto kcal = 25*4 + 2*9 + 10*4 = 100 + 18 + 40 = 158
    await user.click(screen.getByRole('button', { name: /Додати/i }))

    expect(screen.getByText('Протеїновий коктейль')).toBeInTheDocument()
    expect(screen.getByTestId('consumed-kcal-heading')).toHaveTextContent('158 / 1896 ккал')
  })

  it('gracefully recovers from corrupted localStorage data', () => {
    localStorage.setItem('cf_profile', '{invalid-json')
    localStorage.setItem('cf_meals', 'not-an-array')

    render(<App />)
    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1379')
  })
})
