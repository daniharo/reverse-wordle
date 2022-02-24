import { ChangeEventHandler, FC, memo, MouseEventHandler, useState } from 'react'
import cx from 'classnames'
import type { NextPage } from 'next'
import { useFetch } from 'use-http'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { CharCell, CharCellStatus, getDefaultCharCell, getNextStatus, DIM, ATTEMPS, SummaryLogic } from '../src'

const useMatrix = () =>
  useState(() => {
    const initialize = (n: number) => () => Array(n).fill(0)
    const matrix = initialize(ATTEMPS)().map(initialize(DIM))
    return matrix.map(row => row.map(getDefaultCharCell))
  })

type MatrixSetter = ReturnType<typeof useMatrix>[1]

interface IMatch {
  match?: RegExpMatchArray;
}
const Match: FC<IMatch> = ({match}) => (
  <>
    {match
      ? <p className={styles.solutions}>{(match as RegExpMatchArray).join(', ')}</p>
      : 'no results'
      }
  </>
)

const Home: NextPage = () => {
  const { error, data: dataset = '' } = useFetch('/5char.es.txt', {}, [])
  const [matrixData, setMatrixData] = useMatrix()
  const [match, setMatch] = useState<RegExpMatchArray | null>(null)
  const renderCell = (j: number) => function renderSpecificRow (c: CharCell, i: number) {
    return <Cell setter={setMatrixData} i={i} j={j} key={i} data={c} />
  }
  const body = matrixData.map((row, j) => (
    <div className="row" key={j}>
      {row.map(renderCell(j))}
    </div>
  ))
  const onClickSolve = () => {
    const summary = SummaryLogic.fromMatrix(matrixData)
    const regExp = SummaryLogic.toRegExp(summary)
    const match = dataset.match(regExp)
    setMatch(match)
  }
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Reverse Wordle!</h1>
        {body}
        <button onClick={onClickSolve}>Solve</button>
        <Match match={match} />
      </main>
    </div>
  )
}

interface ICell {
  setter: MatrixSetter
  i: number
  j: number
  data: CharCell
}

const Cell: FC<ICell> = ({ setter, i, j, data }) => {
  const onChange: ChangeEventHandler<HTMLInputElement> = evt => {
    setter(m => {
      m[j][i] = {
        ...data,
        char: evt.target?.value,
      }
      return [...m]
    })
  }
  const onRightClick: MouseEventHandler<HTMLInputElement> = evt => {
    evt.preventDefault()
    setter(m => {
      m[j][i] = {
        ...data,
        status: getNextStatus(data.status),
      }
      return [...m]
    })
  }
  const classname = cx(styles.cell, {
    [styles.exact]: data.status === CharCellStatus.Exact,
    [styles.exist]: data.status === CharCellStatus.Exist,
  })
  return (
    <input value={data.char} onChange={onChange} className={classname} maxLength={1} onContextMenu={onRightClick} />
  )
}

const Header = memo(() => (
  <Head>
    <title>Create Next App</title>
    <meta name="description" content="Generated by create next app" />
    <link rel="icon" href="/favicon.ico" />
  </Head>
))

export default Home
