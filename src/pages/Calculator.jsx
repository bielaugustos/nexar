import { useState } from 'react'
import {
  PiCalculatorBold, PiPlusBold, PiMinusBold, PiXBold,
  PiDivideBold, PiEqualsBold, PiPercentBold,
  PiBackspaceBold, PiDotBold
} from 'react-icons/pi'
import styles from './Calculator.module.css'

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  function inputDigit(digit) {
    if (waitingForOperand) {
      setDisplay(String(digit))
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit)
    }
  }

  function inputDot() {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  function clear() {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  function performNextOperation(nextOperation) {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  function calculate(firstValue, secondValue, operation) {
    switch (operation) {
      case '+': return firstValue + secondValue
      case '-': return firstValue - secondValue
      case '×': return firstValue * secondValue
      case '÷': return secondValue !== 0 ? firstValue / secondValue : 'Erro'
      case '%': return firstValue % secondValue
      default: return secondValue
    }
  }

  function performEquals() {
    const inputValue = parseFloat(display)

    if (previousValue === null || !operation) {
      return
    }

    const newValue = calculate(previousValue, inputValue, operation)
    setDisplay(String(newValue))
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(true)
  }

  function toggleSign() {
    const newValue = parseFloat(display) * -1
    setDisplay(String(newValue))
  }

  function inputPercent() {
    const currentValue = parseFloat(display)
    const newValue = currentValue / 100
    setDisplay(String(newValue))
  }

  function backspace() {
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0')
  }

  const buttons = [
    { label: 'C', action: clear, className: styles.btnClear },
    { label: <PiBackspaceBold size={20}/>, action: backspace, className: styles.btnBackspace },
    { label: '%', action: inputPercent, className: styles.btnOperator },
    { label: '÷', action: () => performNextOperation('÷'), className: styles.btnOperator },
    { label: '7', action: () => inputDigit(7), className: styles.btnNumber },
    { label: '8', action: () => inputDigit(8), className: styles.btnNumber },
    { label: '9', action: () => inputDigit(9), className: styles.btnNumber },
    { label: '×', action: () => performNextOperation('×'), className: styles.btnOperator },
    { label: '4', action: () => inputDigit(4), className: styles.btnNumber },
    { label: '5', action: () => inputDigit(5), className: styles.btnNumber },
    { label: '6', action: () => inputDigit(6), className: styles.btnNumber },
    { label: '-', action: () => performNextOperation('-'), className: styles.btnOperator },
    { label: '1', action: () => inputDigit(1), className: styles.btnNumber },
    { label: '2', action: () => inputDigit(2), className: styles.btnNumber },
    { label: '3', action: () => inputDigit(3), className: styles.btnNumber },
    { label: '+', action: () => performNextOperation('+'), className: styles.btnOperator },
    { label: '±', action: toggleSign, className: styles.btnNumber },
    { label: '0', action: () => inputDigit(0), className: styles.btnNumber },
    { label: '.', action: inputDot, className: styles.btnNumber },
    { label: '=', action: performEquals, className: styles.btnEquals },
  ]

  return (
    <main className={styles.page}>
      <div className="card">
        <div className="card-title">
          <PiCalculatorBold size={15}/> Calculadora
        </div>

        <div className={styles.calculator}>
          <div className={styles.display}>
            {operation && previousValue !== null && (
              <div className={styles.operation}>
                {previousValue} {operation}
              </div>
            )}
            <div className={styles.result}>{display}</div>
          </div>

          <div className={styles.buttons}>
            {buttons.map((btn, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.button} ${btn.className}`}
                onClick={btn.action}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
