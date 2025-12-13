from langchain_core.prompts import MessagesPlaceholder
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os
from langchain_classic.chains import create_retrieval_chain, create_history_aware_retriever

from langchain_classic.chains.combine_documents import create_stuff_documents_chain

load_dotenv()
groq_key = os.getenv("GROQ_API_KEY")
if groq_key:
    os.environ["GROQ_API_KEY"] = groq_key


class Chain:
    def __init__(self, model_name="groq:llama-3.1-8b-instant"):
        self.llm = init_chat_model(model=model_name)
        self.history_store={}

    def llmtest(self, prompt="Hello how are you?"):
        print(self.llm.invoke(prompt).content)


    def __ragChain__(self, retriever):
        contextualize_q_system_prompt = """Given a chat history and the latest user question 
        which might reference context in the chat history, formulate a standalone question 
        which can be understood without the chat history. Do NOT answer the question, 
        just reformulate it if needed and otherwise return it as is."""

        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ])
                
        history_aware_retriever = create_history_aware_retriever(
            self.llm, retriever, contextualize_q_prompt
        )

        qa_system_prompt = """You're an e-commerce bot answering product-related queries using reviews and titles.
        Use the following pieces of retrieved context to answer the question in short. Only write short and concise answers 
        If you don't know the answer, just say that you don't know. 

        Context: {context}"""

        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", qa_system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ])
        question_answer_chain = create_stuff_documents_chain(self.llm, qa_prompt)
        
        conversational_rag_chain = create_retrieval_chain(
            history_aware_retriever, 
            question_answer_chain
        )
        
        return RunnableWithMessageHistory(conversational_rag_chain, self._getHistory,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer"
        )


    def _getHistory(self,session_id:str) -> BaseChatMessageHistory:
        if session_id not in self.history_store:
            self.history_store[session_id] = ChatMessageHistory()
        return self.history_store[session_id]
    
